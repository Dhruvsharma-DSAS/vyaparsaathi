"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { storageKey } from "@/lib/config";

export type AuthUser = { id: string; name: string; email: string };
type AuthResponse = { user: AuthUser | null; plan: unknown; error?: string };

type AuthContextValue = {
  user: AuthUser | null;
  status: "loading" | "signed-out" | "signed-in" | "guest";
  /** Use the app without an account; the plan stays in this browser only. */
  continueAsGuest: () => void;
  /** Leave guest mode and show the sign-in screen (the local plan is kept and uploads after sign-in). */
  showSignIn: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  savePlan: (snapshot: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_KEY = "vyaparsaathi-guest";
const readGuest = () => {
  try { return window.localStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
};
const writeGuest = (on: boolean) => {
  try {
    if (on) window.localStorage.setItem(GUEST_KEY, "1");
    else window.localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage blocked: guest mode lasts for this visit only.
  }
};

const clearLocalPlan = () => {
  try {
    Object.keys(window.localStorage).filter((key) => key.startsWith(storageKey)).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage may be blocked; nothing to clear.
  }
};

/** Puts the account's saved plan into browser storage so the app restores it on mount. */
const restorePlan = (plan: unknown) => {
  if (!plan || typeof plan !== "object") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(plan));
  } catch {
    // Ignore: the app still works from memory.
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json() as Promise<AuthResponse>)
      .then((data) => {
        if (!active) return;
        if (data.user) restorePlan(data.plan);
        setUser(data.user);
        setStatus(data.user ? "signed-in" : readGuest() ? "guest" : "signed-out");
      })
      .catch(() => { if (active) setStatus(readGuest() ? "guest" : "signed-out"); });
    return () => { active = false; };
  }, []);

  const submit = useCallback(async (path: string, body: Record<string, string>) => {
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || !data.user) return data.error ?? "Something went wrong. Please try again.";
      if (data.plan) restorePlan(data.plan);
      writeGuest(false);
      setUser(data.user);
      setStatus("signed-in");
      return null;
    } catch {
      return "Could not reach the server. Check your connection.";
    }
  }, []);

  const signIn = useCallback((email: string, password: string) => submit("/api/auth/login", { email, password }), [submit]);
  const signUp = useCallback((name: string, email: string, password: string) => submit("/api/auth/register", { name, email, password }), [submit]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    clearLocalPlan(); // keep a shared phone from showing the previous person's plan
    setUser(null);
    setStatus("signed-out");
  }, []);

  const continueAsGuest = useCallback(() => {
    writeGuest(true);
    setStatus("guest");
  }, []);

  const showSignIn = useCallback(() => {
    writeGuest(false);
    setStatus("signed-out");
  }, []);

  const savePlan = useCallback(async (snapshot: string) => {
    if (!user) return false;
    try {
      const response = await fetch("/api/auth/plan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: snapshot });
      return response.ok;
    } catch {
      return false;
    }
  }, [user]);

  return <AuthContext.Provider value={{ user, status, signIn, signUp, signOut, savePlan, continueAsGuest, showSignIn }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
