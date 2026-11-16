"use client";

import { clsx } from "clsx";
import { Button, Card, CardTitle, Notice, PageHeader } from "@/components/ui";
import { languageOptions } from "@/lib/i18n";
import type { Theme } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { useEffect, useState } from "react";

type DataSummary = { tables: Array<{ label: string; rows: number }> };

export function SettingsScreen() {
  const { copy, theme, setTheme, language, changeLanguage, resetAll, exportData, syncState } = useApp();
  const { user, signOut, status, showSignIn } = useAuth();
  const [summary, setSummary] = useState<DataSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/data")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DataSummary | null) => { if (active) setSummary(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const { x } = copy;
  const themes: Array<{ id: Theme; icon: string }> = [{ id: "light", icon: "light_mode" }, { id: "dark", icon: "dark_mode" }];

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: "vyaparsaathi-data.json" }).click();
    URL.revokeObjectURL(url);
  };

  const choiceClass = (active: boolean) => clsx(
    "flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition",
    active ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50",
  );

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="VyaparSaathi City" title={x.navSettings} sub={x.dataPrivacy} />
      <div className="space-y-4">
        {status === "guest" && (
          <Card className="border-accent/40 bg-accent-soft/40">
            <CardTitle icon="person" title={x.guestTitle} sub={x.guestNote} />
            <Button icon="login" onClick={showSignIn}>{x.signIn} / {x.signUp}</Button>
          </Card>
        )}
        {user && (
          <Card>
            <CardTitle icon="account_circle" title={user.name} sub={`${x.signedInAs} ${user.email}`}
              aside={syncState === "saved" ? <span className="flex items-center gap-1 text-xs font-semibold text-accent"><span className="material-symbols-outlined text-[16px]" aria-hidden="true">cloud_done</span>{x.savedToAccount}</span> : undefined} />
            <Button variant="outline" icon="logout" onClick={() => void signOut()}>{x.signOut}</Button>
          </Card>
        )}
        <Card>
          <CardTitle icon="palette" title={x.theme} />
          <div className="grid grid-cols-2 gap-3">
            {themes.map((option) => (
              <button key={option.id} type="button" aria-pressed={theme === option.id} onClick={() => setTheme(option.id)} className={choiceClass(theme === option.id)}>
                <span className="material-symbols-outlined text-accent" aria-hidden="true">{option.icon}</span>{x[option.id]}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle icon="translate" title="Language" />
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map((option) => (
              <button key={option.code} type="button" aria-pressed={language === option.code} onClick={() => void changeLanguage(option.code)} className={choiceClass(language === option.code)}>
                {option.label}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle icon="install_mobile" title={x.install} sub={x.installHint} />
        </Card>
        <Card>
          <CardTitle icon="database" title={x.exportPlan} sub={x.dataPrivacy} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon="download" onClick={download}>{x.exportPlan}</Button>
            <Button variant="ghost" icon="delete" className="text-bad" onClick={() => { if (window.confirm(x.clearConfirm)) void resetAll(); }}>{x.clearData}</Button>
          </div>
        </Card>
      </div>
      {summary && (
        <Card>
          <CardTitle icon="database" title={`${x.database} · Prisma`} />
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {summary.tables.map((table) => (
              <div key={table.label} className="flex justify-between gap-2 rounded-xl bg-surface-2/70 px-3 py-2">
                <dt className="text-muted">{table.label}</dt>
                <dd className="font-bold tabular-nums">{table.rows.toLocaleString("en-IN")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">© OpenStreetMap contributors (ODbL) · ERA5 via Open-Meteo (CC-BY-4.0)</p>
        </Card>
      )}
      <Notice>{copy.t.sampleNotice}</Notice>
    </div>
  );
}
