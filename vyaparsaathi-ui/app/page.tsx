"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AdvisorScreen } from "@/components/screens/AdvisorScreen";
import { ExploreScreen } from "@/components/screens/ExploreScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { MoneyScreen } from "@/components/screens/MoneyScreen";
import { PitchScreen } from "@/components/screens/PitchScreen";
import { PlanScreen } from "@/components/screens/PlanScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { AppShell } from "@/components/shell/AppShell";
import { Icon } from "@/components/ui";
import type { Screen } from "@/lib/types";
import { AppProvider, useApp } from "@/state/AppProvider";
import { AuthProvider, useAuth } from "@/state/AuthProvider";

/** Screen id → component. Adding a screen means one line here and one nav item in lib/config.ts. */
const screens: Record<Screen, () => React.ReactElement> = {
  home: HomeScreen,
  advisor: AdvisorScreen,
  explore: ExploreScreen,
  money: MoneyScreen,
  plan: PlanScreen,
  pitch: PitchScreen,
  settings: SettingsScreen,
};

/** Order used to decide whether a screen slides in from the left or the right. */
const order: Screen[] = ["home", "advisor", "explore", "plan", "money", "pitch", "settings"];

function CurrentScreen() {
  const { screen, hydrated } = useApp();
  // Remember the screen we came from (React's "store previous value in state" pattern).
  const [history, setHistory] = useState({ current: screen, previous: screen });
  if (history.current !== screen) setHistory({ current: screen, previous: history.current });
  const direction = order.indexOf(screen) >= order.indexOf(history.previous) ? 1 : -1;

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-3xl bg-surface-2" role="status" aria-label="Loading" />;
  }
  const ScreenComponent = screens[screen];
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={screen}
        custom={direction}
        variants={{
          enter: (dir: number) => ({ opacity: 0, x: 24 * dir }),
          center: { opacity: 1, x: 0 },
          exit: (dir: number) => ({ opacity: 0, x: -16 * dir }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <ScreenComponent />
      </motion.div>
    </AnimatePresence>
  );
}

function Splash() {
  return (
    <div className="mx-auto grid min-h-screen max-w-md place-items-center bg-bg">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-ink shadow-lg"><Icon name="storefront" filled className="text-[32px]" /></span>
        <p className="mt-3 font-bold">VyaparSaathi City</p>
      </motion.div>
    </div>
  );
}

function Gate() {
  const { status, user } = useAuth();
  if (status === "loading") return <Splash />;
  if (status === "signed-out" || (!user && status !== "guest")) return <AuthScreen />;
  return (
    // key: a different account (or guest) always starts from its own saved plan
    <AppProvider key={user?.id ?? "guest"}>
      <AppShell>
        <CurrentScreen />
      </AppShell>
    </AppProvider>
  );
}

export default function VyaparSaathiCityApp() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </MotionConfig>
  );
}
