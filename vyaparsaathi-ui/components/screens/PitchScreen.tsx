"use client";

import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { Banner, Button, Card, CardTitle, Icon, Notice, PageHeader } from "@/components/ui";
import { PlanTabs } from "@/components/shell/PlanTabs";
import { formatRupees, median } from "@/lib/format";
import { pitchChecks, pitchSheetText, readinessLevel, readinessScore, type SheetRow } from "@/lib/pitch";
import { useApp } from "@/state/AppProvider";

/** New in this version: a loan-readiness checklist and a printable one-page lender summary. */
export function PitchScreen() {
  const app = useApp();
  const { copy, navigate, vyaparState, financeInputs, financeResult, footfallResult, priceChecks, pilotInputs, pilotResult, completedLicences, supplierQuotes } = app;
  const { t, money, ground, x } = copy;
  const [copied, setCopied] = useState(false);

  const checks = useMemo(() => pitchChecks({ state: vyaparState, financeInputs, financeResult, footfallResult, priceChecks, pilotInputs, completedLicences }),
    [vyaparState, financeInputs, financeResult, footfallResult, priceChecks, pilotInputs, completedLicences]);
  const score = readinessScore(checks);
  const level = readinessLevel(score);
  const priceMedian = median(priceChecks);
  const na = x.notCalculated;

  const rows: SheetRow[] = [
    { label: money.selectBusiness, value: vyaparState.business_context.business_name ?? na },
    { label: t.city, value: [vyaparState.user_profile.city, ...vyaparState.business_context.candidate_zones].join(" · ") },
    { label: money.sellingPrice, value: financeInputs.sellingPrice ? formatRupees(Number(financeInputs.sellingPrice)) : na },
    { label: money.unitCost, value: financeInputs.unitCost ? formatRupees(Number(financeInputs.unitCost)) : na },
    { label: money.startupCost, value: financeInputs.startupCost ? formatRupees(Number(financeInputs.startupCost)) : na },
    { label: money.availableCapital, value: financeInputs.availableCapital ? formatRupees(Number(financeInputs.availableCapital)) : na },
    { label: money.fundingGap, value: financeResult ? formatRupees(financeResult.funding_gap) : na },
    { label: money.monthlyProfit, value: financeResult ? formatRupees(financeResult.estimated_monthly_profit) : na },
    { label: money.breakEven, value: financeResult?.break_even_units_per_day != null ? String(financeResult.break_even_units_per_day) : na },
    { label: money.emi, value: financeResult ? formatRupees(financeResult.monthly_emi) : na },
    { label: ground.estimatedUnits, value: footfallResult ? String(footfallResult.estimated_units_per_day) : na },
    { label: ground.priceMedian, value: priceMedian !== null ? `${formatRupees(priceMedian)} (${priceChecks.length})` : na },
    { label: ground.averageSales, value: pilotResult ? `${pilotResult.average_units_per_day} (${pilotResult.days_recorded}/7)` : na },
    { label: money.landedTitle, value: supplierQuotes[0] ? `${supplierQuotes[0].supplier} · ${formatRupees(supplierQuotes[0].landedCost)}` : na },
    { label: x.readiness, value: `${score}/100 · ${x[level]}` },
  ];
  const text = pitchSheetText(x.sheetTitle, rows, x.pitchDisclaimer);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "vyaparsaathi-pitch-sheet.txt" });
    link.click();
    URL.revokeObjectURL(url);
  };

  const ring = 2 * Math.PI * 52;

  return (
    <div>
      <div className="no-print"><PageHeader title={x.pitchTitle} sub={x.pitchIntro} /><PlanTabs value="pitch" /><Banner src="/illustrations/pitch-sheet.svg" alt="" /></div>
      <div className="mt-4 space-y-4">
        <Card className="no-print">
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={`${x.readiness} ${score}/100`}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={ring} strokeDashoffset={ring * (1 - score / 100)} className="transition-all duration-700" />
              <text x="60" y="68" textAnchor="middle" className="fill-[var(--ink)] text-[30px] font-semibold" transform="rotate(90 60 60)">{score}</text>
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">{x.readiness}</p>
              <p className="mt-1 text-2xl font-semibold">{x[level]}</p>
              <p className="mt-1 text-sm text-muted">{checks.filter((check) => check.done).length}/{checks.length}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2">
            {checks.map((check) => (
              <li key={check.id} className={clsx("flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm", check.done ? "border-ok/30 bg-ok-soft" : "border-line")}>
                <Icon name={check.done ? "check_circle" : "radio_button_unchecked"} filled={check.done} className={clsx("text-[20px]", check.done ? "text-ok" : "text-muted")} />
                <span className="flex-1">{x[check.label]}</span>
                {!check.done && (
                  <button type="button" onClick={() => navigate(check.target, check.id === "footfall" || check.id === "prices" ? "time" : undefined)}
                    className="shrink-0 text-xs font-semibold text-accent hover:underline">{x.fixIt} →</button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card id="pitch-sheet" ruled>
            <CardTitle icon="description" title={x.sheetTitle} sub={new Date().toLocaleDateString()} aside={<span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-bg">{score}/100</span>} />
            <dl className="divide-y divide-line/70 text-sm">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_auto] gap-3 py-2">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className={clsx("text-right font-semibold tabular-nums", row.value === na && "font-normal text-muted")}>{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">{x.pitchDisclaimer}</p>
          </Card>
          <div className="no-print flex flex-wrap gap-2">
            <Button icon="print" onClick={() => window.print()}>{x.printSheet}</Button>
            <Button variant="outline" icon={copied ? "check" : "content_copy"} onClick={() => void copyText()}>{copied ? x.copied : x.copySheet}</Button>
            <Button variant="outline" icon="download" onClick={download}>{x.downloadSheet}</Button>
          </div>
          <Notice tone="info" className="no-print">{money.verify}</Notice>
        </div>
      </div>
    </div>
  );
}
