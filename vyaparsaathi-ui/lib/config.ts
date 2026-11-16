import type { AppCopy } from "./i18n";
import type { City, ExploreTab, GroundInputs, MoneyInputs, Screen, SupplierInputs } from "./types";

/**
 * Every repeated block of UI is described here as data and rendered with .map(),
 * so adding a nav item, form field or category means editing one array.
 */

/** The four bottom-nav sections, as in the original app. */
export type NavItem = { screen: Screen; icon: string; label: (c: AppCopy) => string; title: (c: AppCopy) => string };

export const navItems: NavItem[] = [
  { screen: "home", icon: "home", label: (c) => c.t.navHome, title: () => "VyaparSaathi City" },
  { screen: "advisor", icon: "forum", label: (c) => c.t.navChat, title: (c) => c.t.navChat },
  { screen: "explore", icon: "explore", label: (c) => c.t.navMarket, title: (c) => c.t.marketTitle },
  { screen: "plan", icon: "assignment", label: (c) => c.t.navPlan, title: (c) => c.t.planTitle },
];

/** Which bottom-nav section each screen belongs to. */
export const screenSection: Record<Screen, Screen> = {
  home: "home", advisor: "advisor", explore: "explore",
  plan: "plan", money: "plan", pitch: "plan", settings: "home",
};

/** Section tabs inside "My plan": the original Plan/Money pair plus the new Pitch sheet. */
export const planTabs: Array<{ id: Extract<Screen, "plan" | "money" | "pitch">; label: (c: AppCopy) => string }> = [
  { id: "plan", label: (c) => c.t.navPlan },
  { id: "money", label: (c) => c.money.navLabel },
  { id: "pitch", label: (c) => c.x.navPitch },
];

/** Section tabs inside "Explore", matching the original Market / Rush Clock pair. */
export const exploreTabs: Array<{ id: ExploreTab; label: (c: AppCopy) => string }> = [
  { id: "market", label: (c) => c.t.marketTitle },
  { id: "time", label: (c) => c.t.timeTitle },
];

export const marketCategories: Array<{ id: string; label: (c: AppCopy) => string }> = [
  { id: "fast_food", label: (c) => c.t.fastFood },
  { id: "chai", label: () => "Chai" },
  { id: "pharmacy", label: () => "Pharmacy" },
  { id: "tailor", label: () => "Tailor" },
  { id: "phone_repair", label: () => "Phone repair" },
];

export const cities: City[] = ["Bengaluru", "Pune"];

export type FieldConfig<K extends string> = {
  key: K;
  label: (c: AppCopy) => string;
  type?: "text" | "number";
  wide?: boolean;
  min?: string;
};

export const financeFields: FieldConfig<Exclude<keyof MoneyInputs, "businessId">>[] = [
  { key: "sellingPrice", label: (c) => c.money.sellingPrice },
  { key: "unitCost", label: (c) => c.money.unitCost },
  { key: "startupCost", label: (c) => c.money.startupCost },
  { key: "fixedCosts", label: (c) => c.money.fixedCosts },
  { key: "availableCapital", label: (c) => c.money.availableCapital },
  { key: "dailyUnits", label: (c) => c.money.dailyUnits },
  { key: "annualRate", label: (c) => c.money.annualRate },
  { key: "termMonths", label: (c) => c.money.termMonths },
];

export const supplierFields: FieldConfig<keyof SupplierInputs>[] = [
  { key: "supplier", label: (c) => c.money.supplier, type: "text", wide: true },
  { key: "quantity", label: (c) => c.money.quantity, min: "0.001" },
  { key: "unitPrice", label: (c) => c.money.unitPrice },
  { key: "transport", label: (c) => c.money.transport },
  { key: "charges", label: (c) => c.money.charges },
];

export const footfallFields: FieldConfig<Extract<keyof GroundInputs, "peopleCount" | "minutesCounted" | "sellingHours" | "buyingRate">>[] = [
  { key: "peopleCount", label: (c) => c.ground.peopleCount },
  { key: "minutesCounted", label: (c) => c.ground.minutesCounted },
  { key: "sellingHours", label: (c) => c.ground.sellingHours },
  { key: "buyingRate", label: (c) => c.ground.buyingRate },
];

export const specialCategoryOptions: Array<{ id: "women" | "sc_st"; label: (c: AppCopy) => string }> = [
  { id: "women", label: (c) => c.money.women },
  { id: "sc_st", label: (c) => c.money.scst },
];

// Map coordinates live in the Prisma database (see prisma/schema.prisma and lib/map/seed-data.ts).

export const storageKey = "vyaparsaathi-city";

/** Map layers the user can switch on and off; each reads a table from the Prisma database. */
export type MapLayerId = "areas" | "wards" | "density" | "stations" | "places";
export const mapLayers: Array<{ id: MapLayerId; icon: string; label: string; defaultOn: boolean }> = [
  { id: "areas", icon: "pin_drop", label: "Market areas", defaultOn: true },
  { id: "wards", icon: "grid_view", label: "Ward boundaries", defaultOn: false },
  { id: "density", icon: "blur_on", label: "Business density", defaultOn: true },
  { id: "stations", icon: "train", label: "Rush stations", defaultOn: false },
  { id: "places", icon: "storefront", label: "Places", defaultOn: false },
];
