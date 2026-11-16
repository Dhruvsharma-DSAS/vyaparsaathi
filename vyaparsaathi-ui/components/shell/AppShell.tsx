"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { navItems, screenSection } from "@/lib/config";
import { languageOptions } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";

/** Same frame as the original app: a phone-width column, fixed top bar and fixed bottom nav. */

function LanguageMenu() {
  const { language, changeLanguage } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-lg text-accent hover:bg-surface-2"
      ><Icon name="translate" /></button>
      {open && (
        <div className="absolute right-0 top-11 z-[1100] w-36 rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          {languageOptions.map((option) => (
            <button
              type="button"
              key={option.code}
              onClick={() => { void changeLanguage(option.code); setOpen(false); }}
              className={clsx(
                "w-full rounded-lg px-3 py-2 text-left text-sm",
                language === option.code ? "bg-accent-soft font-bold text-accent" : "hover:bg-surface-2",
              )}
            >{option.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const app = useApp();
  const { copy, screen, navigate, isOnline, theme, setTheme } = app;
  const activeSection = screenSection[screen];
  const title = navItems.find((item) => item.screen === activeSection)?.title(copy) ?? "VyaparSaathi City";

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-x-hidden bg-bg text-ink shadow-2xl">
      <header className="no-print fixed inset-x-0 top-0 z-[1000] mx-auto flex h-16 max-w-md items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Icon name="storefront" className="text-accent" />
          <span className="truncate font-bold">{screen === "home" ? "VyaparSaathi City" : title}</span>
          {!isOnline && <span className="rounded-full bg-warn-soft px-2 py-1 text-[9px] font-bold text-warn">{copy.t.offlineLabel}</span>}
          {app.syncState === "saved" && (
            <motion.span key={app.syncState} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} title={copy.x.savedToAccount} aria-label={copy.x.savedToAccount}>
              <Icon name="cloud_done" className="text-[18px] text-accent" />
            </motion.span>
          )}
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`${copy.x.theme}: ${copy.x[theme === "dark" ? "light" : "dark"]}`}
            className="grid h-10 w-10 place-items-center rounded-lg text-accent hover:bg-surface-2"
          ><Icon name={theme === "dark" ? "light_mode" : "dark_mode"} /></button>
          <LanguageMenu />
          <button
            type="button"
            aria-label={copy.x.navSettings}
            aria-current={screen === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
            className={clsx("grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2", screen === "settings" ? "bg-accent-soft text-accent" : "text-accent")}
          ><Icon name="settings" /></button>
        </div>
      </header>

      <main className="min-h-screen px-5 pb-28 pt-24">
        {!isOnline && <p className="mb-3 rounded-xl bg-warn-soft p-3 text-xs text-warn">{copy.t.offlineStatus}</p>}
        {app.languageError && <p role="alert" className="mb-3 rounded-xl bg-bad-soft p-3 text-sm text-bad">{app.languageError}</p>}
        {children}
      </main>

      <nav aria-label="Main navigation" className="no-print isolate fixed inset-x-0 bottom-0 z-[1000] mx-auto flex max-w-md justify-around rounded-t-2xl bg-surface px-2 py-3 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const active = activeSection === item.screen;
          return (
            <button
              key={item.screen}
              type="button"
              onClick={() => navigate(item.screen)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-1 transition-colors focus-visible:outline-offset-[-2px]",
                active ? "text-accent" : "text-muted",
              )}
            >
              {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-xl bg-accent-soft" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <motion.span animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                <Icon name={item.icon} filled={active} />
              </motion.span>
              <span className="mt-1 truncate text-[10px] font-semibold">{item.label(copy)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
