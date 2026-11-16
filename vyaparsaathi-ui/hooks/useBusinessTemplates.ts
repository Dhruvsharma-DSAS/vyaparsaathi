"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { storageKey } from "@/lib/config";
import { findProfileTemplate, isBusinessTemplates } from "@/lib/guards";
import type { BusinessTemplate } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

/** Loads business templates (with offline cache) and pre-fills the money form from the chat profile. */
export function useBusinessTemplates() {
  const { hydrated, isOnline, vyaparState, financeInputs, setFinanceInputs, copy } = useApp();
  const [templates, setTemplates] = useState<BusinessTemplate[]>([]);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  const { category, business_name: businessName } = vyaparState.business_context;
  const capital = vyaparState.user_profile.available_capital;

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    const cacheKey = `${storageKey}-business-templates`;
    const apply = (list: BusinessTemplate[], isStale: boolean) => {
      setTemplates(list);
      setStale(isStale);
      setError("");
      const match = findProfileTemplate(list, category, businessName);
      if (!match) return;
      setFinanceInputs((previous) => previous.businessId ? previous : {
        ...previous,
        businessId: match.id,
        sellingPrice: previous.sellingPrice || String(match.selling_price),
        unitCost: previous.unitCost || (match.unit_cost === null ? "" : String(match.unit_cost)),
        startupCost: previous.startupCost || String(match.startup_cost),
        fixedCosts: previous.fixedCosts || (match.fixed_monthly_cost === undefined ? "" : String(match.fixed_monthly_cost)),
        availableCapital: previous.availableCapital || String(capital ?? ""),
      });
    };
    api.businessTemplates()
      .then(({ business_templates: list }) => {
        if (!active) return;
        if (!isBusinessTemplates(list)) throw new Error("Invalid templates");
        window.localStorage.setItem(cacheKey, JSON.stringify(list));
        apply(list, false);
      })
      .catch(() => {
        if (!active) return;
        try {
          const cached: unknown = JSON.parse(window.localStorage.getItem(cacheKey) ?? "null");
          if (!isBusinessTemplates(cached)) throw new Error("No cache");
          apply(cached, true);
        } catch {
          setError(copy.money.error);
        }
      });
    return () => { active = false; };
  }, [hydrated, isOnline, category, businessName, capital, setFinanceInputs, copy.money.error]);

  const selected = templates.find((template) => template.id === financeInputs.businessId);
  return { templates, selected, stale, error };
}
