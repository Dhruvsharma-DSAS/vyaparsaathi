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
import { api, isRateLimited, warmUpApi } from "@/lib/api";
import { nowTime } from "@/lib/format";
import { storageKey } from "@/lib/config";
import { useAuth } from "@/state/AuthProvider";
import { copy, getCopy, isLanguage, languageCodes, type AppCopy, type Language } from "@/lib/i18n";
import type {
  ChatMessage,
  ChatProvider,
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

function mergeChatFields<T extends object>(sent: T, current: T, received: T): T {
  const result = { ...current };
  for (const key of Object.keys(sent) as (keyof T)[]) {
    if (Object.is(current[key], sent[key]) && key in received) result[key] = received[key];
  }
  return result;
}

function mergeChatState(sent: VyaparState, current: VyaparState, received: VyaparState): VyaparState {
  const profile = mergeChatFields(sent.user_profile, current.user_profile, received.user_profile);
  const business = mergeChatFields(sent.business_context, current.business_context, received.business_context);
  if (current.user_profile.city !== sent.user_profile.city) {
    profile.district = current.user_profile.district;
    business.candidate_zones = current.business_context.candidate_zones;
  }
  return { ...current, user_profile: profile, business_context: business };
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
  chatProvider: ChatProvider;
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
  messages: ChatMessage[];
  chatStartedAt: number | null;
  sendChat: (text: string, failedIndex?: number) => void;
  syncState: "idle" | "saving" | "saved" | "error";
  exportData: () => string;
};

export type LanguageStatus =
  | { phase: "idle" }
  | { phase: "translating"; language: Language }
  | { phase: "done"; language: Language }
  | { phase: "failed"; language: Language };

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
  const [chatProvider, setChatProvider] = useState<ChatProvider>("auto");
  const [chatStartedAt, setChatStartedAt] = useState<number | null>(null);
  const pendingChat = useRef<Promise<ChatMessage[]> | null>(null);
  const translating = useRef(false);

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
      if (saved.chatProvider === "gemini" || saved.chatProvider === "groq") setChatProvider(saved.chatProvider);
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
    language, chatProvider, activeScreen: screen, exploreTab, theme, vyaparState, financeInputs, financeResult,
    supplierQuotes, completedLicences, groundInputs, priceChecks, footfallResult, rentBurdenResult,
    pilotInputs, pilotResult,
  }), [language, chatProvider, screen, exploreTab, theme, vyaparState, financeInputs, financeResult, supplierQuotes,
    completedLicences, groundInputs, priceChecks, footfallResult, rentBurdenResult, pilotInputs, pilotResult]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Storage can be full or blocked; the app keeps working in memory.
    }
  }, [hydrated, snapshot]);

  useEffect(() => {
    if (hydrated) void warmUpApi();
  }, [hydrated]);

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

  const sendChat = useCallback((text: string, failedIndex?: number) => {
    if (pendingChat.current || translating.current || !text.trim()) return;
    const history = failedIndex === undefined ? messages : messages.slice(0, failedIndex - 1);
    const withUser: ChatMessage[] = [...history, { role: "user", text, time: nowTime() }];
    const cleanHistory = history.filter((item) => item.time && !item.failed).slice(-10)
      .map(({ role, text, time }) => ({ role, text, time }));

    setMessages(withUser);
    setChatStartedAt(Date.now());
    const request = api.chat(vyaparState, text, cleanHistory, chatProvider)
      .then(({ updated_state, response_text }) => {
        setVyaparState((current) => mergeChatState(vyaparState, current, updated_state));
        const reply: ChatMessage = { role: "ai", text: response_text, time: nowTime(), language };
        return [...withUser, reply];
      })
      .catch((error: unknown) => {
        const rateLimited = isRateLimited(error);
        const failed: ChatMessage = {
          role: "ai", text: rateLimited ? copy[language].rateLimit : copy[language].connection,
          time: nowTime(), failed: true, rateLimited,
        };
        return [...withUser, failed];
      })
      .then((transcript) => {
        setMessages(transcript);
        return transcript;
      })
      .finally(() => {
        pendingChat.current = null;
        setChatStartedAt(null);
      });
    pendingChat.current = request;
  }, [chatProvider, language, messages, vyaparState]);

  const translateTranscript = useCallback(async (target: Language) => {
    if (translating.current) return;
    translating.current = true;
    showStatus({ phase: "translating", language: target });
    try {
      const source = await (pendingChat.current ?? messages);
      const missing = source.flatMap((item, index) =>
        !item.failed && item.time && item.language !== target && !item.translations?.[target] ? [index] : []);
      const batches = [];
      for (let start = 0; start < missing.length; start += 6) {
        batches.push(missing.slice(start, start + 6));
      }
      for (const indices of batches) {
        const batch = indices.map((index) => {
          const { role, text, time } = source[index];
          return { role, text, time };
        });
        const { chat_history: result } = await api.translateChat(batch, target, chatProvider);
        if (result.length !== batch.length || result.some((item) => !item.text?.trim())) {
          throw new Error("Incomplete translation");
        }
        const translated = new Map(indices.map((index, offset) => [index, result[offset].text]));
        setMessages((current) => current.map((item, index) => {
          const text = translated.get(index);
          return text ? { ...item, translations: { ...item.translations, [target]: text } } : item;
        }));
      }
      showStatus({ phase: "done", language: target }, 1800);
    } catch {
      showStatus({ phase: "failed", language: target });
    } finally {
      translating.current = false;
    }
  }, [chatProvider, messages, showStatus]);

  const changeLanguage = useCallback(async (next: Language) => {
    if (next === language || translating.current) return;
    setLanguageError("");
    setLanguage(next);
    updateProfile({ language: next });
    await translateTranscript(next);
  }, [language, updateProfile, translateTranscript]);

  const retryTranslation = useCallback(async () => {
    if (languageStatus.phase === "failed") await translateTranscript(languageStatus.language);
  }, [languageStatus, translateTranscript]);

  const dismissLanguageStatus = useCallback(() => showStatus({ phase: "idle" }), [showStatus]);

  const newChat = useCallback(() => {
    if (pendingChat.current || translating.current) return;
    setMessages([{ role: "ai", text: copy[language].greeting, time: "" }]);
    showStatus({ phase: "idle" });
  }, [language, showStatus]);

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
    messages, chatProvider, setChatProvider, chatStartedAt, sendChat, vyaparState, setVyaparState, financeInputs, setFinanceInputs,
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
