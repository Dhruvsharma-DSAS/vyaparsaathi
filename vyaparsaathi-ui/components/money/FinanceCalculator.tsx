"use client";

import { useState } from "react";
import { Button, Card, CardTitle, Field, Loading, Notice, SelectField, StatGrid } from "@/components/ui";
import type { useBusinessTemplates } from "@/hooks/useBusinessTemplates";
import { api } from "@/lib/api";
import { financeFields } from "@/lib/config";
import { formatRupees, toNumber } from "@/lib/format";
import { useApp } from "@/state/AppProvider";

type Props = { templates: ReturnType<typeof useBusinessTemplates> };

export function FinanceCalculator({ templates: { templates, selected, error: loadError } }: Props) {
  const { copy, financeInputs, setFinanceInputs, financeResult, setFinanceResult, setVyaparState, vyaparState } = useApp();
  const { t, money } = copy;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipeCosts, setRecipeCosts] = useState<Array<{ name: string; cost: number }> | null>(null);

  const chooseTemplate = (businessId: string) => {
    const template = templates.find((item) => item.id === businessId);
    setFinanceInputs((previous) => ({
      ...previous,
      businessId,
      sellingPrice: template ? String(template.selling_price) : "",
      unitCost: template?.unit_cost == null ? "" : String(template.unit_cost),
      startupCost: template ? String(template.startup_cost) : "",
      fixedCosts: template?.fixed_monthly_cost === undefined ? "" : String(template.fixed_monthly_cost),
      availableCapital: String(vyaparState.user_profile.available_capital ?? ""),
    }));
    setFinanceResult(null);
    setRecipeCosts(null);
    setError("");
  };

  const costRecipe = async () => {
    if (!selected?.recipe) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.unitCost(selected.recipe);
      setFinanceInputs((previous) => ({ ...previous, unitCost: String(result.unit_cost) }));
      setRecipeCosts(result.items);
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    const required = financeFields.filter((field) => field.key !== "dailyUnits");
    const values = Object.fromEntries(financeFields.map((field) => [field.key, toNumber(financeInputs[field.key]) ?? (field.key === "dailyUnits" ? 0 : null)]));
    if (!financeInputs.businessId || required.some((field) => values[field.key] === null) ||
      Object.values(values).some((value) => value === null || value < 0)) {
      return setError(money.error);
    }
    const body = {
      selling_price: values.sellingPrice!, unit_cost: values.unitCost!, fixed_monthly_cost: values.fixedCosts!,
      startup_cost: values.startupCost!, available_capital: values.availableCapital!, daily_units: values.dailyUnits!,
      annual_interest_rate: values.annualRate!, loan_term_months: values.termMonths!,
    };
    setLoading(true);
    setError("");
    try {
      const result = await api.finance(body);
      setFinanceResult(result);
      setVyaparState((previous) => ({
        ...previous,
        user_profile: { ...previous.user_profile, available_capital: body.available_capital },
        business_context: {
          ...previous.business_context,
          category: financeInputs.businessId,
          business_name: selected?.name ?? previous.business_context.business_name,
          additional_details: { ...previous.business_context.additional_details, business_model: selected?.model },
        },
        financial_evaluation: {
          ...previous.financial_evaluation,
          total_project_cost: body.startup_cost + body.fixed_monthly_cost,
          startup_cost: body.startup_cost, unit_cost: body.unit_cost, selling_price: body.selling_price,
          fixed_monthly_cost: body.fixed_monthly_cost, expected_daily_units: body.daily_units,
          funding_gap: result.funding_gap, loan_required: result.loan_required,
          estimated_monthly_emi: result.monthly_emi, estimated_monthly_profit: result.estimated_monthly_profit,
          break_even_units_per_day: result.break_even_units_per_day,
        },
      }));
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <Card ruled>
        <CardTitle icon="calculate" title={money.calculate} />
        <SelectField
          id="money-business"
          label={money.selectBusiness}
          value={financeInputs.businessId}
          onChange={chooseTemplate}
          placeholder={t.category}
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
        />
        {templates.length === 0 && !loadError && <div className="mt-3"><Loading label={money.loading} /></div>}
        {selected?.recipe && (
          <div className="mt-3">
            <Button variant="outline" icon="soup_kitchen" onClick={() => void costRecipe()} disabled={loading}>{money.useRecipe}</Button>
            {recipeCosts && (
              <ul className="mt-3 space-y-1 rounded-2xl bg-surface-2/60 p-3 text-xs">
                {recipeCosts.map((item) => (
                  <li key={item.name} className="flex justify-between gap-2"><span className="text-muted">{item.name}</span><span className="tabular-nums">{formatRupees(item.cost)}</span></li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {financeFields.map((field) => (
            <Field
              key={field.key}
              label={field.label(copy)}
              value={financeInputs[field.key]}
              onChange={(value) => setFinanceInputs((previous) => ({ ...previous, [field.key]: value }))}
            />
          ))}
        </div>
        {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
        <Button block className="mt-4" icon="functions" onClick={() => void calculate()} disabled={loading || !financeInputs.businessId}>
          {loading ? money.loading : money.calculate}
        </Button>
      </Card>

      <Card className={financeResult ? "" : "grid place-items-center"}>
        {financeResult ? (
          <>
            <CardTitle icon="monitoring" title={selected?.name ?? money.title} />
            <StatGrid stats={[
              { label: money.margin, value: formatRupees(financeResult.margin_per_unit) },
              { label: money.breakEven, value: financeResult.break_even_units_per_day ?? "—" },
              { label: money.monthlyProfit, value: formatRupees(financeResult.estimated_monthly_profit), tone: financeResult.estimated_monthly_profit > 0 ? "ok" : "bad", wide: true },
              { label: money.fundingGap, value: formatRupees(financeResult.funding_gap) },
              { label: money.emi, value: formatRupees(financeResult.monthly_emi), tone: "accent" },
            ]} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted">{copy.x.notCalculated}</p>
        )}
      </Card>
    </div>
  );
}
