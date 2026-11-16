import type { ExtraCopy } from "./i18n/extra";
import type {
  FinanceResult,
  FootfallResult,
  MoneyInputs,
  PilotInputs,
  Screen,
  VyaparState,
} from "./types";

/**
 * Lender pitch sheet: a readiness checklist plus a plain-text one-page summary.
 * Pure functions only, so it works offline and is easy to test.
 */

export type PitchInputs = {
  state: VyaparState;
  financeInputs: MoneyInputs;
  financeResult: FinanceResult | null;
  footfallResult: FootfallResult | null;
  priceChecks: number[];
  pilotInputs: PilotInputs;
  completedLicences: Record<string, boolean>;
};

export type PitchCheck = {
  id: string;
  label: keyof ExtraCopy;
  weight: number;
  done: boolean;
  target: Screen;
};

export function pitchChecks(input: PitchInputs): PitchCheck[] {
  const { state, financeInputs, financeResult: f, footfallResult, priceChecks, pilotInputs, completedLicences } = input;
  const expectedUnits = Number(financeInputs.dailyUnits || 0);
  const pilotDays = pilotInputs.dailySales.filter((value) => value.trim()).length;
  return [
    { id: "business", label: "checkBusiness", weight: 10, target: "money",
      done: Boolean(financeInputs.businessId || state.business_context.business_name) },
    { id: "finance", label: "checkFinance", weight: 15, target: "money", done: f !== null },
    { id: "profit", label: "checkProfit", weight: 15, target: "money", done: (f?.estimated_monthly_profit ?? 0) > 0 },
    { id: "emi", label: "checkEmi", weight: 10, target: "money",
      done: f !== null && f.estimated_monthly_profit > 0 && f.estimated_monthly_profit > f.monthly_emi },
    { id: "breakEven", label: "checkBreakEven", weight: 10, target: "money",
      done: f?.break_even_units_per_day != null && expectedUnits > f.break_even_units_per_day },
    { id: "footfall", label: "checkFootfall", weight: 10, target: "explore", done: footfallResult !== null },
    { id: "prices", label: "checkPrices", weight: 10, target: "explore", done: priceChecks.length >= 3 },
    { id: "pilot", label: "checkPilot", weight: 10, target: "plan", done: pilotDays >= 3 },
    { id: "licences", label: "checkLicences", weight: 5, target: "money",
      done: Object.values(completedLicences).some(Boolean) },
    { id: "loan", label: "checkLoanChoice", weight: 5, target: "money", done: state.user_profile.loan_needed !== null },
  ];
}

export function readinessScore(checks: PitchCheck[]) {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.filter((check) => check.done).reduce((sum, check) => sum + check.weight, 0);
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

export function readinessLevel(score: number): "levelStrong" | "levelBuilding" | "levelEarly" {
  if (score >= 75) return "levelStrong";
  if (score >= 40) return "levelBuilding";
  return "levelEarly";
}

export type SheetRow = { label: string; value: string };

export function pitchSheetText(title: string, rows: SheetRow[], disclaimer: string) {
  const width = Math.max(...rows.map((row) => row.label.length), 10);
  return [
    title,
    "=".repeat(title.length),
    ...rows.map((row) => `${row.label.padEnd(width)}  ${row.value}`),
    "",
    disclaimer,
    `Generated ${new Date().toISOString().slice(0, 10)} with VyaparSaathi City`,
  ].join("\n");
}
