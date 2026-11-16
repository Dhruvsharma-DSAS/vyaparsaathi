"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useId } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* Shared building blocks styled after the original app: white rounded-2xl cards, bold headings, rounded-xl inputs. */

export function Icon({ name, className, filled }: { name: string; className?: string; filled?: boolean }) {
  return <span aria-hidden="true" className={clsx("material-symbols-outlined", filled && "icon-fill", className)}>{name}</span>;
}

export function Card({ children, className, ruled, id }: { children: ReactNode; className?: string; ruled?: boolean; id?: string }) {
  return (
    <section id={id} className={clsx("rise rounded-2xl border border-line/60 p-4 shadow-sm", ruled ? "ledger" : "bg-surface", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ icon, title, aside, sub }: { icon?: string; title: ReactNode; aside?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          {icon && <Icon name={icon} className="text-accent" />}
          {title}
        </h2>
        {aside}
      </div>
      {sub && <p className="mt-2 text-xs leading-relaxed text-muted">{sub}</p>}
    </header>
  );
}

export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <header>
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>}
      <h1 className="text-2xl font-bold">{title}</h1>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </header>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "indigo"; icon?: string; block?: boolean };

export function Button({ variant = "primary", icon, block, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-90",
        variant === "indigo" && "bg-indigo text-surface hover:opacity-90",
        variant === "outline" && "border border-accent px-3 py-2 font-semibold text-accent hover:bg-accent-soft",
        variant === "ghost" && "font-semibold text-muted hover:bg-surface-2",
        block && "w-full py-3",
        className,
      )}
    >
      {icon && <Icon name={icon} className="text-[18px]" />}
      {children}
    </button>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: string;
  placeholder?: string;
  className?: string;
};

export function Field({ label, value, onChange, type = "number", min = "0", placeholder, className }: FieldProps) {
  return (
    <label className={clsx("block text-xs font-semibold text-muted", className)}>
      {label}
      <input
        type={type}
        min={type === "number" ? min : undefined}
        step={type === "number" ? "any" : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

export function SelectField({ id, label, value, onChange, options, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

export type Stat = { label: string; value: ReactNode; wide?: boolean; tone?: "accent" | "ok" | "bad" };

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      {stats.map((stat) => (
        <div key={stat.label} className={clsx(
          "rounded-xl p-3",
          stat.wide && "col-span-2",
          stat.tone === "accent" ? "bg-accent-soft" : stat.tone === "ok" ? "bg-ok-soft" : stat.tone === "bad" ? "bg-bad-soft" : "bg-surface-2/70",
        )}>
          <dt className="text-xs text-muted">{stat.label}</dt>
          <dd className="mt-1 font-bold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Rows({ rows }: { rows: Array<{ label: string; value: ReactNode; strong?: boolean }> }) {
  return (
    <dl className="space-y-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className={clsx("flex justify-between gap-3", row.strong && "font-bold")}>
          <dt>{row.label}</dt>
          <dd className="text-right font-semibold tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "warn", children, className }: { tone?: "warn" | "bad" | "info" | "ok"; children: ReactNode; className?: string }) {
  return (
    <p role={tone === "bad" ? "alert" : undefined} className={clsx(
      "rounded-xl p-3 text-xs leading-relaxed",
      tone === "warn" && "bg-warn-soft text-warn",
      tone === "bad" && "bg-bad-soft text-sm text-bad",
      tone === "info" && "bg-surface-2/70 text-muted",
      tone === "ok" && "bg-ok-soft text-ok",
      className,
    )}>{children}</p>
  );
}

export function Pill({ children, tone = "indigo" }: { children: ReactNode; tone?: "indigo" | "accent" | "ok" }) {
  return (
    <span className={clsx(
      "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
      tone === "indigo" && "bg-indigo-soft text-indigo",
      tone === "accent" && "bg-accent-soft text-accent",
      tone === "ok" && "bg-ok-soft text-ok",
    )}>{children}</span>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** The original app's segmented tabs (grey track, white selected pill), mapped from a list. */
export function SectionTabs<T extends string>({ tabs, value, onChange }: {
  tabs: Array<{ id: T; label: string }>; value: T; onChange: (id: T) => void;
}) {
  const group = useId();
  return (
    <div className="no-print mt-4 grid gap-2 rounded-xl bg-surface-2/70 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx("relative isolate rounded-lg px-3 py-2 text-sm font-semibold transition-colors", value === tab.id ? "text-accent" : "text-muted hover:text-ink")}
        >
          {value === tab.id && <motion.span layoutId={`tab-${group}`} className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Illustration banner used at the top of screens. */
export function Banner({ src, alt, children }: { src: string; alt: string; children?: React.ReactNode }) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-4 overflow-hidden rounded-2xl border border-line/60 bg-accent-soft"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG, no optimisation needed */}
      <img src={src} alt={alt} className="block h-auto w-full" width={320} height={180} />
      {children}
    </motion.figure>
  );
}

export function Loading({ label }: { label: string }) {
  return <p role="status" className="text-sm text-muted">{label}</p>;
}
