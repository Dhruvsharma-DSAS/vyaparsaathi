"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Button, Card, CardTitle, Field, Notice, PageHeader, ProgressBar, Rows } from "@/components/ui";
import { PlanTabs } from "@/components/shell/PlanTabs";
import { api } from "@/lib/api";
import { formatRupees, toNumber } from "@/lib/format";
import { useApp } from "@/state/AppProvider";

const verdictTone = { "good sign": "ok", "slightly below forecast": "warn", "try another spot": "bad" } as const;

export function PlanScreen() {
  const app = useApp();
  const { copy, navigate, vyaparState, progress, financeResult, financeInputs, footfallResult, pilotInputs, setPilotInputs, pilotResult, setPilotResult } = app;
  const { t, money, ground } = copy;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fallbackForecast = footfallResult?.estimated_units_per_day ?? toNumber(financeInputs.dailyUnits);

  const updateDay = (list: "dailySales" | "dailyExpenses", index: number, value: string) => {
    setPilotInputs((previous) => ({ ...previous, [list]: previous[list].map((item, day) => (day === index ? value : item)) }));
    setPilotResult(null);
  };

  const review = async () => {
    const days = pilotInputs.dailySales.map((value, index) => ({ value, index })).filter((day) => day.value.trim());
    const sales = days.map((day) => Number(day.value));
    const forecast = toNumber(pilotInputs.forecast) ?? fallbackForecast;
    if (!sales.length || sales.some((value) => !Number.isFinite(value) || value < 0) || forecast === null || forecast <= 0) return setError(money.error);
    const expenseEntries = days.map((day) => pilotInputs.dailyExpenses[day.index]);
    const filled = expenseEntries.filter((value) => value.trim()).length;
    if (filled > 0 && filled !== days.length) return setError(money.error);
    const dailyExpenses = filled === days.length ? expenseEntries.map(Number) : undefined;
    if (dailyExpenses?.some((value) => !Number.isFinite(value) || value < 0)) return setError(money.error);
    const price = toNumber(financeInputs.sellingPrice);
    const cost = toNumber(financeInputs.unitCost);
    const hasPrices = Boolean(financeInputs.sellingPrice.trim() || financeInputs.unitCost.trim());
    if (hasPrices && (price === null || cost === null || price < 0 || cost < 0)) return setError(money.error);

    setLoading(true);
    setError("");
    try {
      setPilotResult(await api.pilot({
        sales_by_day: sales,
        forecast_units_per_day: forecast,
        ...(hasPrices ? { selling_price: price, unit_cost: cost } : {}),
        ...(dailyExpenses ? { daily_expenses: dailyExpenses } : {}),
      }));
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  const verdictText = pilotResult?.verdict === "good sign" ? ground.goodSign
    : pilotResult?.verdict === "slightly below forecast" ? ground.belowForecast : ground.tryAnotherSpot;
  const recorded = pilotInputs.dailySales.filter((value) => value.trim()).length;

  return (
    <div>
      <PageHeader title={t.planTitle} sub={t.planMessage} />
      <PlanTabs value="plan" />
      <div className="mt-4 space-y-4">
        <div className="space-y-4">
          <Card>
            <CardTitle icon="person_pin" title={t.profile} />
            <ProgressBar percent={progress.percent} label={t.profile} />
            <div className="mt-3">
              <Rows rows={[
                { label: t.city, value: vyaparState.user_profile.city },
                { label: t.profile, value: `${progress.percent}%` },
                ...(vyaparState.business_context.business_name ? [{ label: money.selectBusiness, value: vyaparState.business_context.business_name }] : []),
              ]} />
            </div>
            <Button block className="mt-4" icon="currency_rupee" onClick={() => navigate("money")}>{money.title}</Button>
          </Card>
          {financeResult && (
            <Card ruled>
              <CardTitle icon="monitoring" title={money.title} />
              <Rows rows={[
                { label: money.fundingGap, value: formatRupees(financeResult.funding_gap), strong: true },
                { label: money.monthlyProfit, value: formatRupees(financeResult.estimated_monthly_profit), strong: true },
                { label: money.breakEven, value: financeResult.break_even_units_per_day ?? "—" },
                { label: money.emi, value: formatRupees(financeResult.monthly_emi) },
              ]} />
            </Card>
          )}
        </div>

        <Card ruled>
          <CardTitle icon="auto_stories" title={ground.pilotTitle} sub={ground.pilotNote} aside={<span className="text-xs font-semibold text-muted">{recorded}/7</span>} />
          {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
          <Field
            label={ground.targetUnits}
            value={pilotInputs.forecast}
            placeholder={fallbackForecast === null ? "" : String(fallbackForecast)}
            onChange={(value) => { setPilotInputs((previous) => ({ ...previous, forecast: value })); setPilotResult(null); }}
          />
          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <div className="grid grid-cols-[3rem_1fr_1fr] bg-surface-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              <span>#</span><span>{ground.dayUnits}</span><span>{ground.dailyExpense}</span>
            </div>
            {pilotInputs.dailySales.map((units, index) => (
              <div key={index} className={clsx("grid grid-cols-[3rem_1fr_1fr] items-center gap-2 border-t border-line px-3 py-2", units.trim() && "bg-ok-soft/40")}>
                <span className="font-bold text-accent">{index + 1}</span>
                {(["dailySales", "dailyExpenses"] as const).map((list) => (
                  <input
                    key={list}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    aria-label={`${index + 1} · ${list === "dailySales" ? ground.dayUnits : ground.dailyExpense}`}
                    value={pilotInputs[list][index] ?? ""}
                    onChange={(event) => updateDay(list, index, event.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                ))}
              </div>
            ))}
          </div>
          <Button block className="mt-4" icon="fact_check" onClick={() => void review()} disabled={loading}>{loading ? money.loading : ground.evaluatePilot}</Button>
          {pilotResult && (
            <div className="rise mt-4">
              <Notice tone={verdictTone[pilotResult.verdict]} className="text-sm font-semibold">{verdictText}</Notice>
              <div className="mt-3">
                <Rows rows={[
                  { label: ground.daysRecorded, value: pilotResult.days_recorded },
                  { label: ground.averageSales, value: pilotResult.average_units_per_day },
                  { label: ground.forecastRatio, value: `${Math.round(pilotResult.forecast_ratio * 100)}%` },
                  ...(pilotResult.gross_revenue !== undefined ? [
                    { label: ground.grossRevenue, value: formatRupees(pilotResult.gross_revenue) },
                    { label: ground.itemCost, value: formatRupees(pilotResult.item_cost ?? 0) },
                    { label: ground.grossProfit, value: formatRupees(pilotResult.gross_profit ?? 0) },
                  ] : []),
                  ...(pilotResult.other_expenses !== undefined ? [{ label: ground.dailyExpense, value: formatRupees(pilotResult.other_expenses) }] : []),
                  ...(pilotResult.net_profit !== undefined ? [{ label: ground.netProfit, value: formatRupees(pilotResult.net_profit), strong: true }] : []),
                ]} />
              </div>
            </div>
          )}
        </Card>
      </div>
      <Notice className="mt-5">{t.sampleNotice}</Notice>
    </div>
  );
}
