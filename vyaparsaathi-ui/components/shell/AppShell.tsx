"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
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
        className="grid h-10 w-10 place-items-center rounded-full text-ink/80 transition hover:bg-accent-soft hover:text-accent active:scale-95"
      ><Icon name="translate" className="text-[21px]" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-[1100] w-40 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
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
  const iconButton = "grid h-10 w-10 place-items-center rounded-full text-ink/80 transition hover:bg-accent-soft hover:text-accent active:scale-95";

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-x-hidden bg-bg/70 text-ink sm:my-0 sm:shadow-[0_30px_80px_-30px_rgba(16,38,26,0.35)]">
      <header className="glass no-print fixed inset-x-0 top-0 z-[1000] mx-auto flex h-16 max-w-md items-center justify-between border-b border-line/60 px-4">
        <button type="button" onClick={() => navigate("home")} className="flex min-w-0 items-center gap-2.5 rounded-full pr-2" aria-label={copy.t.navHome}>
          <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-accent/30">
            <Icon name="storefront" filled className="text-[20px]" />
          </span>
          <span className="truncate text-[17px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {screen === "home" ? "VyaparSaathi" : title}
          </span>
          {!isOnline && <span className="rounded-full bg-warn-soft px-2 py-1 text-[9px] font-bold text-warn">{copy.t.offlineLabel}</span>}
          {app.syncState === "saved" && (
            <motion.span key={app.syncState} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} title={copy.x.savedToAccount} aria-label={copy.x.savedToAccount}>
              <Icon name="cloud_done" className="text-[18px] text-accent" />
            </motion.span>
          )}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`${copy.x.theme}: ${copy.x[theme === "dark" ? "light" : "dark"]}`}
            className={iconButton}
          ><Icon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-[21px]" /></button>
          <LanguageMenu />
          <button
            type="button"
            aria-label={copy.x.navSettings}
            aria-current={screen === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
            className={clsx(iconButton, screen === "settings" && "bg-accent-soft text-accent")}
          ><Icon name="settings" className="text-[21px]" /></button>
        </div>
      </header>

      <main className="min-h-screen px-5 pb-32 pt-22">
        {!isOnline && <p className="mb-3 rounded-2xl bg-warn-soft p-3 text-xs text-warn">{copy.t.offlineStatus}</p>}
        {app.languageError && <p role="alert" className="mb-3 rounded-2xl bg-bad-soft p-3 text-sm text-bad">{app.languageError}</p>}
        {children}
      </main>

      {/* Floating dock */}
      <nav
        aria-label="Main navigation"
        className="glass no-print isolate fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-[1000] mx-auto flex w-[calc(100%-28px)] max-w-[400px] justify-between rounded-full border border-line/70 p-1.5 shadow-[0_18px_40px_-16px_rgba(16,38,26,0.45)]"
      >
        {navItems.map((item) => {
          const active = activeSection === item.screen;
          return (
            <button
              key={item.screen}
              type="button"
              onClick={() => navigate(item.screen)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label(copy)}
              className={clsx(
                "relative flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition-colors",
                active ? "text-white" : "text-muted hover:text-ink",
              )}
            >
              {active && <motion.span layoutId="nav-pill" className="brand-gradient absolute inset-0 -z-10 rounded-full shadow-md shadow-accent/30" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              <Icon name={item.icon} filled={active} className="text-[22px]" />
              <AnimatePresence initial={false}>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap text-[13px]"
                  >{item.label(copy)}</motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
