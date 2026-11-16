"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Button, Card, CardTitle, Notice, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import type { BusinessTemplate, LicenceItem } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

export function LicenceChecklist({ selected }: { selected?: BusinessTemplate }) {
  const { copy, completedLicences, setCompletedLicences } = useApp();
  const { money } = copy;
  const [licences, setLicences] = useState<LicenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const done = licences.filter((licence) => completedLicences[licence.id]).length;

  const load = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      setLicences((await api.licences(selected.id, selected.model)).licences);
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle icon="verified" title={money.licences} sub={money.verify} />
      <Button variant="outline" icon="checklist" onClick={() => void load()} disabled={loading || !selected}>{loading ? money.loading : money.licences}</Button>
      {error && <Notice tone="bad" className="mt-3">{error}</Notice>}
      {licences.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-muted">
            <div className="flex-1"><ProgressBar percent={Math.round((done / licences.length) * 100)} label={money.licences} /></div>
            {done}/{licences.length}
          </div>
          <ul className="mt-3 space-y-2">
            {licences.map((licence) => {
              const checked = Boolean(completedLicences[licence.id]);
              return (
                <li key={licence.id} className={clsx("rounded-2xl border p-3 transition", checked ? "border-ok/40 bg-ok-soft" : "border-line")}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[var(--ok)]"
                      checked={checked}
                      onChange={(event) => setCompletedLicences((previous) => ({ ...previous, [licence.id]: event.target.checked }))}
                    />
                    <span className={clsx(checked && "line-through opacity-70")}>{licence.name}</span>
                  </label>
                  <p className="ml-7 mt-1 text-xs text-muted">{licence.where}. {licence.note}</p>
                  {licence.official_url && (
                    <a href={licence.official_url} target="_blank" rel="noopener noreferrer" className="ml-7 mt-1 inline-block text-xs font-semibold text-accent underline">{money.verify}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
