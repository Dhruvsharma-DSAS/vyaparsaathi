"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Button, Card, CardTitle, Notice, Pill } from "@/components/ui";
import { api } from "@/lib/api";
import { specialCategoryOptions } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import type { BusinessTemplate, SchemeMatch } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

export function LoanSchemes({ selected }: { selected?: BusinessTemplate }) {
  const { copy, vyaparState, updateProfile, financeResult } = useApp();
  const { money } = copy;
  const wantsLoan = vyaparState.user_profile.loan_needed;
  const [categories, setCategories] = useState<string[]>([]);
  const [schemes, setSchemes] = useState<SchemeMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const choices = [
    { value: true, label: money.wantsLoan, icon: "account_balance" },
    { value: false, label: money.noLoan, icon: "savings" },
  ];

  const choose = (value: boolean) => {
    setSchemes([]);
    setSearched(false);
    updateProfile({ loan_needed: value });
  };

  const search = async () => {
    if (!selected || !financeResult) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.schemes({
        business_model: selected.model, funding_gap: financeResult.funding_gap, wants_loan: true, special_categories: categories,
      });
      setSchemes(result.schemes);
      setSearched(true);
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle icon="account_balance" title={money.loanOptions} />
      <div className="grid gap-2">
        {choices.map((choice) => (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={wantsLoan === choice.value}
            onClick={() => choose(choice.value)}
            className={clsx(
              "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold transition",
              wantsLoan === choice.value ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50",
            )}
          >
            <span className="material-symbols-outlined text-[20px] text-accent" aria-hidden="true">{choice.icon}</span>
            {choice.label}
          </button>
        ))}
      </div>

      {wantsLoan && (
        <div className="mt-4">
          <fieldset>
            <legend className="text-xs font-semibold text-muted">{money.specialCategory}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {specialCategoryOptions.map((option) => {
                const checked = categories.includes(option.id);
                return (
                  <label key={option.id} className={clsx("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm", checked ? "border-indigo bg-indigo-soft text-indigo" : "border-line")}>
                    <input
                      type="checkbox"
                      className="accent-[var(--indigo)]"
                      checked={checked}
                      onChange={(event) => setCategories((previous) => event.target.checked ? [...previous, option.id] : previous.filter((item) => item !== option.id))}
                    />
                    {option.label(copy)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Button className="mt-4" variant="indigo" icon="search" onClick={() => void search()} disabled={loading || !financeResult}>{money.findSchemes}</Button>
          {!financeResult && <p className="mt-2 text-xs text-muted">{copy.x.notCalculated}</p>}
          <Notice tone="info" className="mt-4">{money.preliminary} {money.verify}</Notice>
          {error && <Notice tone="bad" className="mt-3">{error}</Notice>}
          {searched && schemes.length === 0 && <p className="mt-3 text-sm text-muted">{money.noSchemes}</p>}
          <div className="mt-3 space-y-3">
            {schemes.map((scheme) => (
              <article key={scheme.id} className="rise rounded-2xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{scheme.name}</h3>
                    <p className="text-xs text-muted">≤ {formatRupees(scheme.maximum_amount)}</p>
                  </div>
                  <Pill tone="accent">{scheme.match_label} · {scheme.match_percent}%</Pill>
                </div>
                <p className="mt-2 text-xs text-muted">{scheme.note}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
                  {[...scheme.reasons, ...scheme.documents].map((item) => <li key={item}>{item}</li>)}
                </ul>
                {scheme.official_url && (
                  <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-accent underline">
                    {scheme.name} · {money.verify}
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
