"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui";
import { languageOptions, type Language } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";

const nameOf = (language: Language) => languageOptions.find((option) => option.code === language)?.label ?? language;

/** Shows what happens after a language change: translating → done, or failed with a retry. */
export function LanguageStatusBanner() {
  const { languageStatus: status, copy, retryTranslation, dismissLanguageStatus } = useApp();
  const { x } = copy;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[68px] z-[1001] mx-auto flex max-w-md justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {status.phase !== "idle" && (
          <motion.div
            key="language-status"
            layout
            role={status.phase === "failed" ? "alert" : "status"}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={clsx(
              "pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_14px_34px_-18px_rgba(16,38,26,0.6)]",
              status.phase === "failed" ? "border-bad/30 bg-bad-soft text-bad" : "glass border-line text-ink",
            )}
          >
            <div className="flex items-center gap-3">
              {status.phase === "translating" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon name="translate" className="animate-pulse text-[18px]" />
                </span>
              )}
              {status.phase === "done" && (
                <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Icon name="check" className="text-[18px]" />
                </motion.span>
              )}
              {status.phase === "failed" && <Icon name="error" filled className="shrink-0 text-[22px]" />}

              <p className="min-w-0 flex-1 text-sm font-semibold">
                {status.phase === "translating" && x.translatingTo.replace("{language}", nameOf(status.language))}
                {status.phase === "done" && x.languageChanged.replace("{language}", nameOf(status.language))}
                {status.phase === "failed" && x.translateFailed}
              </p>

              {status.phase === "translating" && <Icon name="progress_activity" className="animate-spin text-[20px] text-accent" />}
              {status.phase === "failed" && (
                <>
                  <button type="button" onClick={() => void retryTranslation()} className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-accent shadow-sm">
                    {x.retry}
                  </button>
                  <button type="button" onClick={dismissLanguageStatus} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface/60">
                    <Icon name="close" className="text-[18px]" />
                  </button>
                </>
              )}
            </div>
            {status.phase === "translating" && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-accent-soft">
                <span className="loading-bar block h-full w-1/3 rounded-full bg-accent" />
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
