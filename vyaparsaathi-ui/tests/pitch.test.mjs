import assert from "node:assert/strict";
import test from "node:test";
import { marketGap } from "../lib/map/gap.ts";
import { pitchChecks, pitchSheetText, readinessLevel, readinessScore } from "../lib/pitch.ts";

const baseState = {
  user_profile: { language: "English", city: "Bengaluru", district: null, available_capital: null, skills: [], assets: [], working_hours: null, loan_needed: null },
  business_context: { mode: null, category: null, business_name: null, candidate_zones: [], competitor_count: null, supply_distance_km: null, daily_input_cost: null, additional_details: {} },
  financial_evaluation: {},
};
const emptyFinance = { businessId: "", sellingPrice: "", unitCost: "", startupCost: "", fixedCosts: "", availableCapital: "", dailyUnits: "", annualRate: "12", termMonths: "12" };
const week = (values = []) => Array.from({ length: 7 }, (_, i) => values[i] ?? "");

const input = (overrides = {}) => ({
  state: baseState,
  financeInputs: emptyFinance,
  financeResult: null,
  footfallResult: null,
  priceChecks: [],
  pilotInputs: { forecast: "", dailySales: week(), dailyExpenses: week() },
  completedLicences: {},
  ...overrides,
});

test("an empty plan scores zero and is early stage", () => {
  const score = readinessScore(pitchChecks(input()));
  assert.equal(score, 0);
  assert.equal(readinessLevel(score), "levelEarly");
});

test("a complete plan scores 100", () => {
  const checks = pitchChecks(input({
    state: { ...baseState, user_profile: { ...baseState.user_profile, loan_needed: true } },
    financeInputs: { ...emptyFinance, businessId: "momo_cart", dailyUnits: "80" },
    financeResult: { margin_per_unit: 43, break_even_units_per_day: 7, estimated_monthly_profit: 94000, funding_gap: 0, loan_required: false, monthly_emi: 3000 },
    footfallResult: { people_per_hour: 300, estimated_units_per_day: 40, buying_rate: 0.015 },
    priceChecks: [50, 60, 70],
    pilotInputs: { forecast: "40", dailySales: week(["30", "35", "41"]), dailyExpenses: week() },
    completedLicences: { fssai: true },
  }));
  assert.ok(checks.every((check) => check.done), checks.filter((c) => !c.done).map((c) => c.id).join());
  assert.equal(readinessScore(checks), 100);
  assert.equal(readinessLevel(100), "levelStrong");
});

test("EMI check fails when profit does not cover the EMI", () => {
  const checks = pitchChecks(input({
    financeResult: { margin_per_unit: 5, break_even_units_per_day: 50, estimated_monthly_profit: 1000, funding_gap: 20000, loan_required: true, monthly_emi: 1800 },
  }));
  assert.equal(checks.find((check) => check.id === "emi").done, false);
  assert.equal(checks.find((check) => check.id === "profit").done, true);
});

test("pitch sheet text lists every row and the disclaimer", () => {
  const text = pitchSheetText("Summary", [{ label: "City", value: "Pune" }], "Not a loan approval.");
  assert.match(text, /City\s+Pune/);
  assert.match(text, /Not a loan approval\./);
});

test("map gap labels match the backend rules", () => {
  // BTM Layout sample: 7 places, 16,080 people, city median 5.42. Python returns "some gap" (19.7% rounds to 20).
  assert.deepEqual(marketGap(7, 16080, 5.42), { placesPer10000: 4.35, gapFraction: 0.197, label: "some gap" });
  assert.equal(marketGap(1, 20000, 5).label, "big gap");
  assert.equal(marketGap(20, 10000, 5).label, "crowded");
  assert.equal(marketGap(3, 10000, 0).label, "insufficient data");
});
