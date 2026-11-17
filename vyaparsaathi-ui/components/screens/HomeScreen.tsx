"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Card, Icon, Notice } from "@/components/ui";
import { cities } from "@/lib/config";
import type { City, Mode, Screen } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";

const modes: Array<{ mode: Mode; icon: string; primary: boolean }> = [
  { mode: "discover", icon: "lightbulb", primary: true },
  { mode: "launch", icon: "rocket_launch", primary: false },
];

const cityIcons: Record<City, string> = { Bengaluru: "temple_hindu", Pune: "fort" };

type Tile = { screen: Screen; icon: string; tone: string; label: (c: ReturnType<typeof useApp>["copy"]) => string };
const tiles: Tile[] = [
  { screen: "advisor", icon: "forum", tone: "bg-accent-soft text-accent", label: (c) => c.t.navChat },
  { screen: "explore", icon: "map", tone: "bg-sky-soft text-sky", label: (c) => c.t.navMarket },
  { screen: "plan", icon: "assignment", tone: "bg-saffron-soft text-saffron", label: (c) => c.t.navPlan },
  { screen: "pitch", icon: "workspace_premium", tone: "bg-coral-soft text-coral", label: (c) => c.x.navPitch },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
});

function ProgressRing({ percent }: { percent: number }) {
  const r = 26;
  const length = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={length}
        initial={{ strokeDashoffset: length }}
        animate={{ strokeDashoffset: length * (1 - percent / 100) }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

export function HomeScreen() {
  const { copy, vyaparState, setCity, progress, setVyaparState, newChat, navigate } = useApp();
  const { t, x } = copy;
  const { status, showSignIn } = useAuth();
  const city = vyaparState.user_profile.city;

  const chooseMode = (mode: Mode) => {
    setVyaparState((previous) => ({ ...previous, business_context: { ...previous.business_context, mode } }));
    newChat();
    navigate("advisor");
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.section {...rise(0)} className="brand-gradient relative overflow-hidden rounded-[28px] p-5 text-white shadow-[0_24px_50px_-24px_rgba(11,107,58,0.7)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-saffron/25 blur-2xl" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">VyaparSaathi City</p>
        <h1 className="relative mt-2 text-[28px] font-extrabold leading-[1.1] tracking-tight">{t.welcome}</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-white/85">{t.welcomeDescription}</p>
        <div className="relative mt-4 overflow-hidden rounded-2xl bg-white/90">
          {/* eslint-disable-next-line @next/next/no-img-element -- local SVG illustration */}
          <img src="/illustrations/hero-stall.svg" alt="" width={640} height={360} className="float block h-auto w-full" />
        </div>
      </motion.section>

      {/* Choose a path */}
      <div className="grid gap-3">
        {modes.map(({ mode, icon, primary }, index) => (
          <motion.button
            key={mode}
            type="button"
            {...rise(0.08 + index * 0.06)}
            whileTap={{ scale: 0.98 }}
            onClick={() => chooseMode(mode)}
            className={clsx(
              "group flex items-center gap-4 rounded-3xl p-4 text-left transition",
              primary
                ? "bg-ink text-bg shadow-[0_18px_36px_-20px_rgba(16,38,26,0.8)]"
                : "border border-line/80 bg-surface text-ink hover:border-accent/60",
            )}
          >
            <span className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", primary ? "bg-saffron text-ink" : "bg-accent-soft text-accent")}>
              <Icon name={icon} filled className="text-[24px]" />
            </span>
            <span className="flex-1 text-base font-bold leading-snug">{t[mode]}</span>
            <Icon name="arrow_forward" className="text-[22px] opacity-70 transition group-hover:translate-x-1" />
          </motion.button>
        ))}
      </div>

      {/* City + profile */}
      <motion.div {...rise(0.16)} className="grid grid-cols-[1.25fr_1fr] gap-3">
        <div className="rounded-3xl border border-line/70 bg-surface p-4">
          <p className="text-xs font-bold text-muted">{t.chooseCity}</p>
          <div className="mt-3 grid gap-2" role="radiogroup" aria-label={t.chooseCity}>
            {cities.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={city === option}
                onClick={() => setCity(option)}
                className={clsx(
                  "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  city === option ? "bg-accent text-white shadow-sm" : "bg-surface-2/70 text-ink hover:bg-accent-soft",
                )}
              >
                <Icon name={cityIcons[option]} filled={city === option} className="text-[18px]" />
                {option}
                {city === option && <Icon name="check" className="ml-auto text-[18px]" />}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("advisor")}
          className="flex flex-col items-center justify-center rounded-3xl border border-line/70 bg-surface p-4 text-center transition hover:border-accent/60"
        >
          <div className="relative">
            <ProgressRing percent={progress.percent} />
            <span className="absolute inset-0 grid place-items-center text-sm font-extrabold">{progress.percent}%</span>
          </div>
          <p className="mt-2 text-xs font-bold leading-tight">{t.profile}</p>
          <p className="mt-0.5 text-[11px] text-muted">{t.answers.replace("{complete}", String(progress.filled))}</p>
        </button>
      </motion.div>

      {/* Tools */}
      <motion.div {...rise(0.22)}>
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted">{x.quickTools}</p>
        <div className="grid grid-cols-4 gap-2">
          {tiles.map((tile) => (
            <motion.button
              key={tile.screen}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(tile.screen)}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center"
            >
              <span className={clsx("grid h-14 w-14 place-items-center rounded-2xl shadow-sm", tile.tone)}>
                <Icon name={tile.icon} filled className="text-[26px]" />
              </span>
              <span className="text-[11px] font-semibold leading-tight">{tile.label(copy)}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Story video */}
      <motion.div {...rise(0.28)}>
        <Card className="overflow-hidden p-0">
          <video
            className="aspect-video w-full object-cover"
            autoPlay muted loop playsInline preload="metadata"
            poster="/media/saathi-story-poster.jpg"
            aria-label={x.videoCaption}
          >
            <source src="/media/saathi-story.webm" type="video/webm" />
            <source src="/media/saathi-story.mp4" type="video/mp4" />
          </video>
          <p className="flex items-start gap-2 p-4 text-sm leading-relaxed text-muted"><Icon name="play_circle" filled className="text-accent" />{x.videoCaption}</p>
        </Card>
      </motion.div>

      {/* Pitch sheet */}
      <motion.button
        type="button"
        {...rise(0.32)}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("pitch")}
        className="flex w-full items-center gap-4 rounded-3xl bg-coral-soft p-4 text-left"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-coral text-white"><Icon name="workspace_premium" filled /></span>
        <span className="flex-1">
          <span className="block font-bold">{x.pitchTitle}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{x.readiness}</span>
        </span>
        <Icon name="chevron_right" className="text-coral" />
      </motion.button>

      {status === "guest" && (
        <button type="button" onClick={showSignIn} className="flex w-full items-center gap-3 rounded-3xl border border-dashed border-accent/50 bg-surface px-4 py-3.5 text-left text-sm">
          <Icon name="cloud_off" className="text-muted" />
          <span className="flex-1"><span className="block font-semibold">{x.guestTitle}</span><span className="text-xs text-muted">{x.signIn} / {x.signUp}</span></span>
          <Icon name="chevron_right" className="text-accent" />
        </button>
      )}

      <Notice>{t.sampleNotice}</Notice>
    </div>
  );
}
