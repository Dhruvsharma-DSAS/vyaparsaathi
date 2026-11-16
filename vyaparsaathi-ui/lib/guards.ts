import type { BusinessTemplate, City, CityMarketData, RecipeIngredient } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecipeIngredient(value: unknown): value is RecipeIngredient {
  if (!isRecord(value) || typeof value.name !== "string" || !isFiniteNumber(value.weight_g)) return false;
  const costs = [value.mandi_price_per_quintal, value.retail_price_per_kg, value.fixed_cost];
  return costs.every((cost) => cost === undefined || (isFiniteNumber(cost) && cost >= 0)) &&
    costs.some((cost) => cost !== undefined);
}

export function isBusinessTemplates(value: unknown): value is BusinessTemplate[] {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (item.model === "mobile" || item.model === "fixed" || item.model === "home") &&
    isFiniteNumber(item.selling_price) &&
    isFiniteNumber(item.startup_cost) &&
    (isFiniteNumber(item.unit_cost) || item.unit_cost === null) &&
    typeof item.unit_cost_is_sample === "boolean" &&
    (item.fixed_monthly_cost === undefined || (isFiniteNumber(item.fixed_monthly_cost) && item.fixed_monthly_cost >= 0)) &&
    (item.recipe === undefined || (Array.isArray(item.recipe) && item.recipe.every(isRecipeIngredient))),
  );
}

export function isCityMarketData(value: unknown, city: City): value is CityMarketData {
  if (!isRecord(value)) return false;
  return value.city === city &&
    Array.isArray(value.areas) && value.areas.every((area) => typeof area === "string") &&
    typeof value.map_available === "boolean" &&
    Array.isArray(value.market_samples) && value.market_samples.every((sample) =>
      isRecord(sample) &&
      typeof sample.area === "string" &&
      typeof sample.category === "string" &&
      ["places_found", "population", "city_median_places_per_10000", "supply_distance_km", "places_per_10000", "gap_fraction"]
        .every((key) => isFiniteNumber(sample[key])) &&
      typeof sample.supply_market === "string" &&
      typeof sample.confidence === "string" &&
      typeof sample.label === "string",
    ) &&
    Array.isArray(value.rush_samples) && value.rush_samples.every((sample) =>
      isRecord(sample) &&
      typeof sample.station === "string" &&
      typeof sample.day_type === "string" &&
      typeof sample.working_hours === "string" &&
      typeof sample.confidence === "string" &&
      isRecord(sample.hourly_rush_index) &&
      Object.entries(sample.hourly_rush_index).every(([hour, index]) =>
        /^\d{1,2}$/.test(hour) && isFiniteNumber(index) && index >= 0 && index <= 100),
    ) &&
    typeof value.confidence === "string";
}

export function findProfileTemplate(templates: BusinessTemplate[], businessId: string | null, businessName: string | null) {
  const name = businessName?.toLowerCase();
  return templates.find((template) => template.id === businessId || template.name.toLowerCase() === name);
}
