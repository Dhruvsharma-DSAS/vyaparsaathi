"use client";

import { FinanceCalculator } from "@/components/money/FinanceCalculator";
import { LicenceChecklist } from "@/components/money/LicenceChecklist";
import { LoanSchemes } from "@/components/money/LoanSchemes";
import { SupplierQuotes } from "@/components/money/SupplierQuotes";
import { PlanTabs } from "@/components/shell/PlanTabs";
import { Banner, Notice, PageHeader } from "@/components/ui";
import { useBusinessTemplates } from "@/hooks/useBusinessTemplates";
import { useApp } from "@/state/AppProvider";

export function MoneyScreen() {
  const { copy } = useApp();
  const templates = useBusinessTemplates();

  return (
    <div>
      <PageHeader title={copy.money.title} sub={copy.t.sampleNotice} />
      <PlanTabs value="money" />
      <Banner src="/illustrations/money-ledger.svg" alt="" />
      {templates.stale && <Notice className="mt-3">{copy.t.cachedNotice}</Notice>}
      {templates.error && <Notice tone="bad" className="mt-3">{templates.error}</Notice>}
      <div className="mt-4 space-y-4">
        <div className="space-y-4"><FinanceCalculator templates={templates} /></div>
        <LoanSchemes selected={templates.selected} />
        <div className="space-y-4">
          <LicenceChecklist selected={templates.selected} />
          <SupplierQuotes />
        </div>
      </div>
    </div>
  );
}
