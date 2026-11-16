import type { Language } from "./i18n/languages";

export type City = "Bengaluru" | "Pune";
export type Mode = "discover" | "launch";
export type BusinessModel = "mobile" | "fixed" | "home";
export type Theme = "light" | "dark";

export type Screen = "home" | "advisor" | "explore" | "money" | "plan" | "pitch" | "settings";
export type ExploreTab = "market" | "time";

export type ChatMessage = {
  role: "ai" | "user";
  text: string;
  time: string;
};

export type UserProfile = {
  language: Language;
  city: City;
  district: string | null;
  available_capital: number | null;
  skills: string[];
  assets: string[];
  working_hours: string | null;
  loan_needed: boolean | null;
};

export type VyaparState = {
  user_profile: UserProfile;
  business_context: {
    mode: Mode | null;
    category: string | null;
    business_name: string | null;
    candidate_zones: string[];
    competitor_count: number | null;
    supply_distance_km: number | null;
    daily_input_cost: number | null;
    additional_details: Record<string, unknown>;
  };
  financial_evaluation: {
    total_project_cost: number | null;
    startup_cost: number | null;
    unit_cost: number | null;
    selling_price: number | null;
    fixed_monthly_cost: number | null;
    expected_daily_units: number | null;
    funding_gap: number | null;
    loan_required: boolean | null;
    estimated_monthly_emi: number | null;
    estimated_monthly_profit: number | null;
    break_even_units_per_day: number | null;
  };
};

export type RecipeIngredient = {
  name: string;
  weight_g: number;
  mandi_price_per_quintal?: number;
  retail_price_per_kg?: number;
  fixed_cost?: number;
};

export type BusinessTemplate = {
  id: string;
  name: string;
  model: BusinessModel;
  selling_price: number;
  startup_cost: number;
  fixed_monthly_cost?: number;
  unit_cost: number | null;
  unit_cost_is_sample: boolean;
  recipe?: RecipeIngredient[];
};

export type MoneyInputs = {
  businessId: string;
  sellingPrice: string;
  unitCost: string;
  startupCost: string;
  fixedCosts: string;
  availableCapital: string;
  dailyUnits: string;
  annualRate: string;
  termMonths: string;
};

export type FinanceResult = {
  margin_per_unit: number;
  break_even_units_per_day: number | null;
  estimated_monthly_profit: number;
  funding_gap: number;
  loan_required: boolean;
  monthly_emi: number;
};

export type SchemeMatch = {
  id: string;
  name: string;
  maximum_amount: number;
  official_url: string | null;
  documents: string[];
  note: string;
  last_checked: string | null;
  match_percent: number;
  match_label: string;
  reasons: string[];
  verify_before_applying: boolean;
};

export type LicenceItem = {
  id: string;
  name: string;
  where: string;
  official_url: string | null;
  note: string;
  required: boolean;
};

export type SupplierQuote = { supplier: string; landedCost: number };

export type SupplierInputs = {
  supplier: string;
  quantity: string;
  unitPrice: string;
  transport: string;
  charges: string;
};

export type GroundInputs = {
  peopleCount: string;
  minutesCounted: string;
  sellingHours: string;
  buyingRate: string;
  observedPrice: string;
  monthlyRent: string;
};

export type PilotInputs = {
  forecast: string;
  dailySales: string[];
  dailyExpenses: string[];
};

export type FootfallResult = {
  people_per_hour: number;
  estimated_units_per_day: number;
  buying_rate: number;
};

export type RentBurdenResult = {
  monthly_rent: number;
  estimated_monthly_sales: number;
  rent_share_percent: number | null;
};

export type PilotResult = {
  days_recorded: number;
  average_units_per_day: number;
  forecast_units_per_day: number;
  forecast_ratio: number;
  verdict: "good sign" | "slightly below forecast" | "try another spot";
  gross_revenue?: number;
  item_cost?: number;
  gross_profit?: number;
  other_expenses?: number;
  net_profit?: number;
};

export type ChatResponse = {
  updated_state: VyaparState;
  response_text: string;
};

export type MarketSample = {
  area: string;
  category: string;
  places_found: number;
  population: number;
  city_median_places_per_10000: number;
  supply_market: string;
  supply_distance_km: number;
  confidence: string;
  places_per_10000: number;
  gap_fraction: number;
  label: string;
};

export type RushSample = {
  station: string;
  day_type: string;
  working_hours: string;
  hourly_rush_index: Record<string, number>;
  confidence: string;
};

export type CityMarketData = {
  city: City;
  areas: string[];
  map_available: boolean;
  market_samples: MarketSample[];
  rush_samples: RushSample[];
  confidence: string;
};

export type RushResult = {
  hourly_index: Record<string, number>;
  best_start_hour: number;
  best_end_hour: number;
  average_rush_index: number;
};

export type WeatherResult = {
  timezone: string | null;
  hourly: Array<{
    time: string;
    temperature_celsius: number;
    precipitation_probability: number;
    advice: "rain" | "heat" | "normal";
  }>;
  confidence: string;
};
