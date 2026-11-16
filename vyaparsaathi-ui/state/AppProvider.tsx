"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { api } from "@/lib/api";
import { storageKey } from "@/lib/config";
import { useAuth } from "@/state/AuthProvider";
import { copy, getCopy, isLanguage, languageCodes, type AppCopy, type Language } from "@/lib/i18n";
import type {
  ChatMessage,
  City,
  ExploreTab,
  FinanceResult,
  FootfallResult,
  GroundInputs,
  MoneyInputs,
  PilotInputs,
  PilotResult,
  RentBurdenResult,
  Screen,
  SupplierQuote,
  Theme,
  VyaparState,
} from "@/lib/types";

const emptyWeek = () => Array.from({ length: 7 }, () => "");

export function createInitialState(language: Language): VyaparState {
  return {
    user_profile: {
      language, city: "Bengaluru", district: null, available_capital: null,
      skills: [], assets: [], working_hours: null, loan_needed: null,
    },
    business_context: {
      mode: null, category: null, business_name: null, candidate_zones: [],
      competitor_count: null, supply_distance_km: null, daily_input_cost: null, additional_details: {},
    },
    financial_evaluation: {
      total_project_cost: null, startup_cost: null, unit_cost: null, selling_price: null,
      fixed_monthly_cost: null, expected_daily_units: null, funding_gap: null, loan_required: null,
      estimated_monthly_emi: null, estimated_monthly_profit: null, break_even_units_per_day: null,
    },
  };
}

const initialFinance: MoneyInputs = {
  businessId: "", sellingPrice: "", unitCost: "", startupCost: "", fixedCosts: "",
  availableCapital: "", dailyUnits: "", annualRate: "12", termMonths: "12",
};
const initialGround: GroundInputs = {
  peopleCount: "", minutesCounted: "10", sellingHours: "", buyingRate: "1.5", observedPrice: "", monthlyRent: "",
};
const initialPilot = (): PilotInputs => ({ forecast: "", dailySales: emptyWeek(), dailyExpenses: emptyWeek() });

const screens: Screen[] = ["home", "advisor", "explore", "money", "plan", "pitch", "settings"];
const legacyScreens: Record<string, Screen> = { market: "explore", time: "explore" };

/** Persisted slices; each gets a typed setter with the same name prefixed by "set". */
type Persisted = {
  messages: ChatMessage[];
  vyaparState: VyaparState;
  financeInputs: MoneyInputs;
  financeResult: FinanceResult | null;
  supplierQuotes: SupplierQuote[];
  completedLicences: Record<string, boolean>;
  groundInputs: GroundInputs;
  priceChecks: number[];
  footfallResult: FootfallResult | null;
  rentBurdenResult: RentBurdenResult | null;
  pilotInputs: PilotInputs;
  pilotResult: PilotResult | null;
};

type Setters = { [K in keyof Persisted as `set${Capitalize<K & string>}`]: Dispatch<SetStateAction<Persisted[K]>> };

type AppContextValue = Persisted & Setters & {
  copy: AppCopy;
  language: Language;
  changeLanguage: (language: Language) => Promise<void>;
  languageError: string;
  /** Progress of the last language change, for loading and result messages. */
  languageStatus: LanguageStatus;
  retryTranslation: () => Promise<void>;
  dismissLanguageStatus: () => void;
  screen: Screen;
  navigate: (screen: Screen, tab?: ExploreTab) => void;
  exploreTab: ExploreTab;
  setExploreTab: (tab: ExploreTab) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isOnline: boolean;
  hydrated: boolean;
  setCity: (city: City) => void;
  updateProfile: (patch: Partial<VyaparState["user_profile"]>) => void;
  progress: { filled: number; percent: number };
  resetAll: () => Promise<void>;
  newChat: () => void;
  syncState: "idle" | "saving" | "saved" | "error";
  exportData: () => string;
};

export type LanguageStatus =
  | { phase: "idle" }
  | { phase: "translating"; language: Language }
  | { phase: "done"; language: Language }
  | { phase: "failed"; language: Language; from: Language; source: ChatMessage[] };

const AppContext = createContext<AppContextValue | null>(null);

const subscribeNetwork = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("English");
  const [screen, setScreen] = useState<Screen>("home");
  const [exploreTab, setExploreTab] = useState<ExploreTab>("market");
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [languageStatus, setLanguageStatus] = useState<LanguageStatus>({ phase: "idle" });
  const [transcriptCache, setTranscriptCache] = useState<Partial<Record<Language, ChatMessage[]>>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "ai", text: copy.English.greeting, time: "" }]);
  const [vyaparState, setVyaparState] = useState<VyaparState>(() => createInitialState("English"));
  const [financeInputs, setFinanceInputs] = useState<MoneyInputs>(initialFinance);
  const [financeResult, setFinanceResult] = useState<FinanceResult | null>(null);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([]);
  const [completedLicences, setCompletedLicences] = useState<Record<string, boolean>>({});
  const [groundInputs, setGroundInputs] = useState<GroundInputs>(initialGround);
  const [priceChecks, setPriceChecks] = useState<number[]>([]);
  const [footfallResult, setFootfallResult] = useState<FootfallResult | null>(null);
  const [rentBurdenResult, setRentBurdenResult] = useState<RentBurdenResult | null>(null);
  const [pilotInputs, setPilotInputs] = useState<PilotInputs>(initialPilot);
  const [pilotResult, setPilotResult] = useState<PilotResult | null>(null);

  const isOnline = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);

  // Restore everything saved on this device (same key and shape as the original app).
  // localStorage only exists in the browser, so this one-time read has to run in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // Light mode is the default; dark mode only when the user picked it.
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Persisted> & {
        language?: string; activeScreen?: string; exploreTab?: ExploreTab; theme?: Theme;
      };
      const lang = saved.language && isLanguage(saved.language) ? saved.language : "English";
      const initial = createInitialState(lang);
      const profile = saved.vyaparState?.user_profile;
      setLanguage(lang);
      setThemeState(saved.theme === "dark" ? "dark" : "light");
      setVyaparState({
        ...initial,
        ...saved.vyaparState,
        user_profile: {
          ...initial.user_profile, ...profile,
          city: profile?.city ?? (profile?.district === "Pune" ? "Pune" : "Bengaluru"),
          language: lang, skills: profile?.skills ?? [], assets: profile?.assets ?? [],
        },
        business_context: {
          ...initial.business_context, ...saved.vyaparState?.business_context,
          candidate_zones: saved.vyaparState?.business_context?.candidate_zones ?? [],
          additional_details: saved.vyaparState?.business_context?.additional_details ?? {},
        },
        financial_evaluation: { ...initial.financial_evaluation, ...saved.vyaparState?.financial_evaluation },
      });
      const restoredScreen = legacyScreens[saved.activeScreen ?? ""] ?? saved.activeScreen;
      if (restoredScreen && screens.includes(restoredScreen as Screen)) setScreen(restoredScreen as Screen);
      if (saved.activeScreen === "time") setExploreTab("time");
      else if (saved.exploreTab === "market" || saved.exploreTab === "time") setExploreTab(saved.exploreTab);
      // Every visit starts a fresh chat (the plan and profile are kept).
      setMessages([{ role: "ai", text: copy[lang].greeting, time: "" }]);
      if (saved.financeInputs) setFinanceInputs({ ...initialFinance, ...saved.financeInputs });
      if (saved.financeResult) setFinanceResult(saved.financeResult);
      if (saved.supplierQuotes) setSupplierQuotes(saved.supplierQuotes);
      if (saved.completedLicences) setCompletedLicences(saved.completedLicences);
      if (saved.groundInputs) setGroundInputs({ ...initialGround, ...saved.groundInputs });
      if (saved.priceChecks) setPriceChecks(saved.priceChecks);
      if (saved.footfallResult) setFootfallResult(saved.footfallResult);
      if (saved.rentBurdenResult) setRentBurdenResult(saved.rentBurdenResult);
      if (saved.pilotInputs) {
        setPilotInputs({
          forecast: saved.pilotInputs.forecast ?? "",
          dailySales: emptyWeek().map((_, i) => saved.pilotInputs?.dailySales?.[i] ?? ""),
          dailyExpenses: emptyWeek().map((_, i) => saved.pilotInputs?.dailyExpenses?.[i] ?? ""),
        });
      }
      if (saved.pilotResult) setPilotResult(saved.pilotResult);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const snapshot = useMemo(() => ({
    language, activeScreen: screen, exploreTab, theme, vyaparState, financeInputs, financeResult,
    supplierQuotes, completedLicences, groundInputs, priceChecks, footfallResult, rentBurdenResult,
    pilotInputs, pilotResult,
  }), [language, screen, exploreTab, theme, vyaparState, financeInputs, financeResult, supplierQuotes,
    completedLicences, groundInputs, priceChecks, footfallResult, rentBurdenResult, pilotInputs, pilotResult]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Storage can be full or blocked; the app keeps working in memory.
    }
  }, [hydrated, snapshot]);

  // Also save the plan to the signed-in account, at most once every 1.5 s while the user is editing.
  const { savePlan } = useAuth();
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      setSyncState("saving");
      void savePlan(JSON.stringify(snapshot)).then((ok) => setSyncState(ok ? "saved" : "error"));
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [hydrated, snapshot, savePlan]);

  useEffect(() => {
    document.documentElement.lang = languageCodes[language];
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const updateProfile = useCallback((patch: Partial<VyaparState["user_profile"]>) => {
    setVyaparState((previous) => ({ ...previous, user_profile: { ...previous.user_profile, ...patch } }));
  }, []);

  const setCity = useCallback((city: City) => {
    setVyaparState((previous) => ({
      ...previous,
      user_profile: { ...previous.user_profile, city, district: city },
      business_context: { ...previous.business_context, candidate_zones: [] },
    }));
  }, []);

  const navigate = useCallback((next: Screen, tab?: ExploreTab) => {
    setScreen(next);
    if (tab) setExploreTab(tab);
    window.scrollTo({ top: 0 });
  }, []);

  const statusTimer = useRef<number | undefined>(undefined);
  const showStatus = useCallback((status: LanguageStatus, autoHideMs?: number) => {
    window.clearTimeout(statusTimer.current);
    setLanguageStatus(status);
    if (autoHideMs) statusTimer.current = window.setTimeout(() => setLanguageStatus({ phase: "idle" }), autoHideMs);
  }, []);

  /** Translates the visible chat into `target`, reporting progress through languageStatus. */
  const translateTranscript = useCallback(async (source: ChatMessage[], from: Language, target: Language) => {
    // Swap the built-in greeting right away; the rest is translated by the API.
    setMessages(source.map((message) =>
      message.role === "ai" && message.text === copy[from].greeting ? { ...message, text: copy[target].greeting } : message));
    const toTranslate = source.filter((message) => !(message.role === "ai" && message.text === copy[from].greeting));
    if (toTranslate.length === 0) {
      showStatus({ phase: "done", language: target }, 1800);
      return;
    }
    showStatus({ phase: "translating", language: target });
    try {
      const { chat_history: translated } = await api.translateChat(source, target);
      if (!Array.isArray(translated) || translated.length !== source.length ||
        translated.some((message) => typeof message.text !== "string" || !message.text.trim())) {
        throw new Error("Incomplete translation");
      }
      const merged = source.map((message, index) => ({ ...message, text: translated[index].text }));
      setMessages(merged);
      setTranscriptCache((cache) => ({ ...cache, [target]: merged }));
      showStatus({ phase: "done", language: target }, 1800);
    } catch {
      // Keep the new language; the user can retry translating the older messages.
      showStatus({ phase: "failed", language: target, from, source });
    }
  }, [showStatus]);

  const changeLanguage = useCallback(async (next: Language) => {
    setLanguageError("");
    if (next === language || languageStatus.phase === "translating") return;
    const previous = language;
    setLanguage(next);
    updateProfile({ language: next });
    setTranscriptCache((cache) => ({ ...cache, [previous]: messages }));
    const cached = transcriptCache[next];
    if (cached) {
      setMessages(cached);
      showStatus({ phase: "done", language: next }, 1800);
      return;
    }
    await translateTranscript(messages, previous, next);
  }, [language, languageStatus.phase, messages, transcriptCache, updateProfile, showStatus, translateTranscript]);

  const retryTranslation = useCallback(async () => {
    if (languageStatus.phase !== "failed") return;
    await translateTranscript(languageStatus.source, languageStatus.from, languageStatus.language);
  }, [languageStatus, translateTranscript]);

  const dismissLanguageStatus = useCallback(() => showStatus({ phase: "idle" }), [showStatus]);

  const newChat = useCallback(() => {
    setTranscriptCache({});
    setMessages([{ role: "ai", text: copy[language].greeting, time: "" }]);
  }, [language]);

  const progress = useMemo(() => {
    const { user_profile: profile, business_context: business } = vyaparState;
    const filled = [
      business.mode === "discover" || Boolean(business.business_name),
      profile.available_capital !== null,
      profile.skills.length > 0,
      business.candidate_zones.length > 0,
      Boolean(profile.working_hours),
    ].filter(Boolean).length;
    return { filled, percent: filled * 20 };
  }, [vyaparState]);

  const resetAll = useCallback(async () => {
    // Clear the copy saved in the account too, otherwise it would be restored on the next load.
    await savePlan("{}");
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(storageKey))
      .forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  }, [savePlan]);

  const exportData = useCallback(() => JSON.stringify(snapshot, null, 2), [snapshot]);

  const value: AppContextValue = {
    copy: getCopy(language), language, changeLanguage, languageError, languageStatus, retryTranslation, dismissLanguageStatus,
    screen, navigate, exploreTab, setExploreTab, theme, setTheme: setThemeState,
    isOnline, hydrated, setCity, updateProfile, progress, resetAll, exportData, syncState, newChat,
    messages, setMessages, vyaparState, setVyaparState, financeInputs, setFinanceInputs,
    financeResult, setFinanceResult, supplierQuotes, setSupplierQuotes, completedLicences, setCompletedLicences,
    groundInputs, setGroundInputs, priceChecks, setPriceChecks, footfallResult, setFootfallResult,
    rentBurdenResult, setRentBurdenResult, pilotInputs, setPilotInputs, pilotResult, setPilotResult,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}
