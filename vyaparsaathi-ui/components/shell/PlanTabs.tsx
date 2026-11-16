"use client";

import { SectionTabs } from "@/components/ui";
import { planTabs } from "@/lib/config";
import { useApp } from "@/state/AppProvider";

/** "My plan" section tabs: Plan · Money · Pitch. */
export function PlanTabs({ value }: { value: "plan" | "money" | "pitch" }) {
  const { copy, navigate } = useApp();
  return (
    <SectionTabs
      tabs={planTabs.map((tab) => ({ id: tab.id, label: tab.label(copy) }))}
      value={value}
      onChange={(id) => navigate(id)}
    />
  );
}
