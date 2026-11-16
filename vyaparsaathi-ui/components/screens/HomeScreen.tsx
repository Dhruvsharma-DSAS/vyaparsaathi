"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Card, Icon, Notice, ProgressBar, SelectField } from "@/components/ui";
import { cities } from "@/lib/config";
import type { City, Mode, Screen } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

const modes: Array<{ mode: Mode; icon: string; primary: boolean }> = [
  { mode: "discover", icon: "lightbulb", primary: true },
  { mode: "launch", icon: "rocket_launch", primary: false },
];

const shortcuts: Array<{ screen: Screen; icon: string; label: "navMarket" | "navPlan" }> = [
  { screen: "explore", icon: "explore", label: "navMarket" },
  { screen: "plan", icon: "assignment", label: "navPlan" },
];

export function HomeScreen() {
  const { copy, vyaparState, setCity, progress, setVyaparState, setMessages, navigate } = useApp();
  const { t, x } = copy;

  const chooseMode = (mode: Mode) => {
    setVyaparState((previous) => ({ ...previous, business_context: { ...previous.business_context, mode } }));
    setMessages([{ role: "ai", text: t.greeting, time: "" }]);
    navigate("advisor");
  };

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">VyaparSaathi City</p>
      <h1 className="text-3xl font-extrabold leading-tight">{t.welcome}</h1>
      <p className="mt-3 text-muted">{t.welcomeDescription}</p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 overflow-hidden rounded-3xl border border-line/60 bg-accent-soft"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local SVG illustration */}
        <img src="/illustrations/hero-stall.svg" alt="" width={640} height={360} className="float block h-auto w-full" />
      </motion.div>

      <div className="mt-7">
        <SelectField
          id="city-select"
          label={t.chooseCity}
          value={vyaparState.user_profile.city}
          onChange={(value) => setCity(value as City)}
          options={cities.map((city) => ({ value: city, label: city }))}
        />
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">{t.profile}</h2>
          <span className="text-xs font-semibold text-muted">{t.answers.replace("{complete}", String(progress.filled))}</span>
        </div>
        <div className="mt-3"><ProgressBar percent={progress.percent} label={t.profile} /></div>
      </Card>

      <div className="mt-6 grid gap-3">
        {modes.map(({ mode, icon, primary }, index) => (
          <motion.button
            key={mode}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.07 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => chooseMode(mode)}
            className={clsx(
              "flex min-h-20 items-center justify-between rounded-2xl px-5 py-4 text-left font-bold transition",
              primary ? "bg-accent text-accent-ink shadow-md hover:opacity-90" : "border-2 border-accent bg-surface text-accent hover:bg-accent-soft",
            )}
          >
            <span>{t[mode]}</span>
            <Icon name={icon} />
          </motion.button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.screen}
            type="button"
            onClick={() => navigate(shortcut.screen)}
            className="rounded-xl border border-line bg-surface px-3 py-3 text-sm font-semibold"
          >
            <Icon name={shortcut.icon} className="mr-1 align-middle text-base" />
            {t[shortcut.label]}
          </button>
        ))}
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <video
          className="aspect-video w-full object-cover"
          autoPlay muted loop playsInline preload="metadata"
          poster="/media/saathi-story-poster.jpg"
          aria-label={x.videoCaption}
        >
          <source src="/media/saathi-story.webm" type="video/webm" />
          <source src="/media/saathi-story.mp4" type="video/mp4" />
        </video>
        <p className="flex items-start gap-2 p-4 text-sm text-muted"><Icon name="play_circle" className="text-accent" />{x.videoCaption}</p>
      </Card>

      <button
        type="button"
        onClick={() => navigate("pitch")}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-accent bg-accent-soft/60 px-4 py-3 text-left text-sm font-semibold text-accent"
      >
        <span className="flex items-center gap-2"><Icon name="workspace_premium" />{x.pitchTitle}</span>
        <Icon name="chevron_right" />
      </button>

      <Notice className="mt-5">{t.sampleNotice}</Notice>
    </div>
  );
}
