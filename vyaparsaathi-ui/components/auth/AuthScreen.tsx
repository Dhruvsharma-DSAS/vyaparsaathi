"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";
import { storageKey } from "@/lib/config";
import { getCopy, isLanguage, languageOptions, type Language } from "@/lib/i18n";
import { useAuth } from "@/state/AuthProvider";

type Mode = "signIn" | "signUp";

function savedLanguage(): Language {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as { language?: string };
    return saved.language && isLanguage(saved.language) ? saved.language : "English";
  } catch {
    return "English";
  }
}

/** Sign in / create account, in the same phone-width frame as the rest of the app. */
export function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [language, setLanguage] = useState<Language>(() => (typeof window === "undefined" ? "English" : savedLanguage()));
  const [mode, setMode] = useState<Mode>("signIn");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { x, t } = getCopy(language);

  const fields: Array<{ key: keyof typeof form; label: string; type: string; autoComplete: string; hint?: string; show: boolean }> = [
    { key: "name", label: x.fullName, type: "text", autoComplete: "name", show: mode === "signUp" },
    { key: "email", label: x.email, type: "email", autoComplete: "email", show: true },
    { key: "password", label: x.password, type: "password", autoComplete: mode === "signUp" ? "new-password" : "current-password", hint: mode === "signUp" ? x.passwordHint : undefined, show: true },
  ];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const message = mode === "signIn" ? await signIn(form.email, form.password) : await signUp(form.name, form.email, form.password);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-bg px-5 pb-10 pt-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold"><Icon name="storefront" className="text-accent" />VyaparSaathi City</div>
        <select
          aria-label="Language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
        >
          {languageOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="mt-6 overflow-hidden rounded-3xl border border-line/60 bg-surface shadow-sm">
        <video
          className="aspect-video w-full object-cover"
          autoPlay muted loop playsInline
          poster="/media/saathi-story-poster.jpg"
          aria-label={x.videoCaption}
        >
          <source src="/media/saathi-story.webm" type="video/webm" />
          <source src="/media/saathi-story.mp4" type="video/mp4" />
        </video>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className="mt-6 text-3xl font-extrabold leading-tight">{x.authTitle}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-muted">{x.authSub}</motion.p>

      <div className="relative mt-6 grid grid-cols-2 rounded-xl bg-surface-2/70 p-1">
        {(["signIn", "signUp"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => { setMode(option); setError(""); }}
            className={clsx("relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors", mode === option ? "text-accent" : "text-muted")}
          >
            {mode === option && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            {x[option]}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3" noValidate>
        <AnimatePresence initial={false}>
          {fields.filter((field) => field.show).map((field) => (
            <motion.label
              key={field.key}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="block overflow-hidden text-xs font-semibold text-muted"
            >
              {field.label}
              <input
                type={field.type}
                autoComplete={field.autoComplete}
                required
                value={form[field.key]}
                onChange={(event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base font-normal text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
              {field.hint && <span className="mt-1 block font-normal">{field.hint}</span>}
            </motion.label>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-bad-soft p-3 text-sm text-bad">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 font-bold text-accent-ink shadow-md disabled:opacity-60"
        >
          {busy ? <Icon name="progress_activity" className="animate-spin" /> : <Icon name={mode === "signIn" ? "login" : "person_add"} />}
          {busy ? x.authWorking : x[mode]}
        </motion.button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />{x.or}<span className="h-px flex-1 bg-line" />
      </div>
      <motion.button
        type="button"
        onClick={continueAsGuest}
        whileTap={{ scale: 0.97 }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-surface px-4 py-3.5 font-bold text-accent transition hover:bg-accent-soft"
      >
        <Icon name="person" />
        {x.continueGuest}
      </motion.button>
      <p className="mt-2 text-center text-xs text-muted">{x.guestNote}</p>

      <p className="mt-4 text-center text-sm text-muted">
        {mode === "signIn" ? x.newHere : x.haveAccount}{" "}
        <button type="button" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(""); }} className="font-semibold text-accent underline-offset-4 hover:underline">
          {mode === "signIn" ? x.signUp : x.signIn}
        </button>
      </p>
      <p className="mt-6 rounded-xl bg-warn-soft p-3 text-xs leading-relaxed text-warn">{t.sampleNotice}</p>
    </div>
  );
}
