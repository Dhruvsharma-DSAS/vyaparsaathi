import axios from "axios";
import type {
  BusinessTemplate,
  ChatMessage,
  ChatResponse,
  City,
  FinanceResult,
  FootfallResult,
  LicenceItem,
  PilotResult,
  RecipeIngredient,
  RentBurdenResult,
  RushResult,
  SchemeMatch,
  VyaparState,
  WeatherResult,
} from "./types";

/**
 * All calls go to this site's own /api/backend proxy (app/api/backend/[...path]/route.ts),
 * which forwards them to the Python API. No CORS setup and no rebuild when the API URL changes.
 */
export const apiBaseUrl = "/api/backend";

// Generous timeout: a sleeping free Render instance can take about a minute to wake up.
const http = axios.create({ baseURL: apiBaseUrl, timeout: 110000 });

const get = <T>(path: string, params?: Record<string, unknown>) => http.get<T>(path, { params }).then((r) => r.data);
const post = <T>(path: string, body: unknown) => http.post<T>(path, body).then((r) => r.data);

/** Every backend route in one typed map, so screens never build URLs themselves. */
export const api = {
  chat: (state: VyaparState, message: string, chat_history: ChatMessage[]) =>
    post<ChatResponse>("/api/chat-loop", { state, message, chat_history }),
  translateChat: (chat_history: ChatMessage[], language: string) =>
    post<{ chat_history: ChatMessage[] }>("/api/translate-chat", { chat_history, language }),
  businessTemplates: () => get<{ business_templates: BusinessTemplate[] }>("/api/city/business-templates"),
  marketData: (city: City) => get<unknown>("/api/city/market-data", { city }),
  rushClock: (hourly_rush_index: Record<string, number>, working_hours: string) =>
    post<RushResult>("/api/city/rush-clock", { hourly_rush_index, working_hours }),
  weather: (latitude: number, longitude: number) => get<WeatherResult>("/api/city/weather", { latitude, longitude }),
  unitCost: (ingredients: RecipeIngredient[]) =>
    post<{ unit_cost: number; items: Array<{ name: string; cost: number }> }>("/api/city/unit-cost", { ingredients }),
  finance: (body: Record<string, number>) => post<FinanceResult>("/api/city/finance", body),
  schemes: (body: { business_model: string; funding_gap: number; wants_loan: boolean; special_categories: string[] }) =>
    post<{ schemes: SchemeMatch[] }>("/api/city/schemes", body),
  licences: (business_id: string, business_model: string) =>
    post<{ licences: LicenceItem[] }>("/api/city/licences", { business_id, business_model }),
  landedCost: (body: { unit_price: number; quantity: number; transport_cost: number; other_charges: number }) =>
    post<{ landed_cost_per_unit: number }>("/api/city/landed-cost", body),
  footfall: (body: { people_count: number; minutes_counted: number; selling_hours: number; buying_rate: number }) =>
    post<FootfallResult>("/api/city/footfall-forecast", body),
  rentBurden: (body: { monthly_rent: number; estimated_daily_units: number; selling_price: number }) =>
    post<RentBurdenResult>("/api/city/rent-burden", body),
  pilot: (body: Record<string, unknown>) => post<PilotResult>("/api/city/pilot", body),
};

export const isRateLimited = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 429;

/** Wakes a sleeping API early (e.g. when the chat opens) so the first real request is fast. */
export const warmUpApi = () => http.get("/health", { timeout: 110000 }).then(() => true).catch(() => false);
