"use client";

import { useState } from "react";

export type AppScreen = "home" | "advisor" | "market" | "time" | "money" | "plan";
export type AppLanguage = "English" | "Hindi" | "Marathi" | "Gujarati" | "Bengali";

type LanguageOption = {
  code: AppLanguage;
  label: string;
};

type TopAppBarProps = {
  title?: string;
  online: boolean;
  offlineLabel: string;
  language: AppLanguage;
  languages: readonly LanguageOption[];
  onLanguageChange: (language: AppLanguage) => Promise<void>;
};

export function TopAppBar({
  title = "VyaparSaathi City",
  online,
  offlineLabel,
  language,
  languages,
  onLanguageChange,
}: TopAppBarProps) {
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const chooseLanguage = async (nextLanguage: AppLanguage) => {
    await onLanguageChange(nextLanguage);
    setLanguageMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-center justify-between border-b border-outline-variant bg-surface px-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">storefront</span>
        <div className="min-w-0">
          <span className="font-bold">{title}</span>
          {!online && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-900">{offlineLabel}</span>}
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Change language"
          aria-expanded={languageMenuOpen}
          onClick={() => setLanguageMenuOpen((open) => !open)}
          className="material-symbols-outlined rounded-lg p-2 text-primary hover:bg-surface-container"
        >translate</button>
        {languageMenuOpen && (
          <div className="absolute right-0 top-11 z-50 w-36 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl">
            {languages.map((option) => (
              <button
                type="button"
                key={option.code}
                onClick={() => void chooseLanguage(option.code)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${language === option.code ? "bg-primary-container/20 font-bold text-primary" : "text-on-surface hover:bg-surface-container-low"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

type BottomNavProps = {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  labels: {
    home: string;
    advisor: string;
    explore: string;
    plan: string;
  };
};

export function BottomNav({ activeScreen, onNavigate, labels }: BottomNavProps) {
  const exploreActive = activeScreen === "market" || activeScreen === "time";
  const planActive = activeScreen === "money" || activeScreen === "plan";
  const items = [
    { screen: "home" as const, icon: "home", label: labels.home, active: activeScreen === "home" },
    { screen: "advisor" as const, icon: "forum", label: labels.advisor, active: activeScreen === "advisor" },
    { screen: "market" as const, icon: "explore", label: labels.explore, active: exploreActive },
    { screen: "plan" as const, icon: "assignment", label: labels.plan, active: planActive },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md justify-around rounded-t-2xl bg-white px-2 py-3 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {items.map(({ screen, icon, label, active }) => (
        <button
          type="button"
          key={screen}
          onClick={() => onNavigate(screen)}
          aria-current={active ? "page" : undefined}
          className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-1 ${active ? "bg-primary-container/20 text-primary" : "text-outline"}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
          <span className="mt-1 truncate text-[10px] font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}

type SectionTabsProps = {
  firstLabel: string;
  secondLabel: string;
  selected: "first" | "second";
  onSelect: (section: "first" | "second") => void;
};

export function SectionTabs({
  firstLabel,
  secondLabel,
  selected,
  onSelect,
}: SectionTabsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1">
      {([
        ["first", firstLabel],
        ["second", secondLabel],
      ] as const).map(([section, label]) => (
        <button
          key={section}
          type="button"
          aria-pressed={selected === section}
          onClick={() => onSelect(section)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${selected === section ? "bg-white text-primary shadow-sm" : "text-outline"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
