/**
 * Business groups and locality comparison, carried over from the D-vyparsathi Locality analyser.
 * Pure functions so the map, the API and the tests share one definition.
 */

export type BusinessGroup = { id: string; label: string; colour: string; tags: string[] };

export const BUSINESS_GROUPS: BusinessGroup[] = [
  { id: "food", label: "Food & meals", colour: "#e4572e", tags: ["restaurant", "fast_food", "food_court", "snacks"] },
  { id: "drinks", label: "Cafés & drinks", colour: "#a0522d", tags: ["cafe", "tea", "coffee", "juice", "beverages"] },
  { id: "bakery", label: "Bakeries & sweets", colour: "#d97706", tags: ["bakery", "confectionery", "chocolate", "ice_cream", "pastry"] },
  { id: "grocery", label: "Groceries & produce", colour: "#15803d", tags: ["supermarket", "convenience", "greengrocer", "grocery", "dairy", "butcher", "seafood"] },
  { id: "tailoring", label: "Clothing & tailoring", colour: "#c026d3", tags: ["tailor", "clothes", "boutique", "fabric", "shoes", "shoemaker"] },
  { id: "repair", label: "Electronics & repair", colour: "#2563eb", tags: ["mobile_phone", "mobile_phone_repair", "electronics", "computer", "appliance", "electrician"] },
  { id: "beauty", label: "Salons & beauty", colour: "#db2777", tags: ["hairdresser", "beauty", "cosmetics"] },
  { id: "laundry", label: "Laundry & cleaning", colour: "#0891b2", tags: ["laundry", "dry_cleaning"] },
  { id: "printing", label: "Print & stationery", colour: "#7c3aed", tags: ["stationery", "copyshop", "books"] },
  { id: "pharmacy", label: "Pharmacies & health", colour: "#dc2626", tags: ["pharmacy", "chemist", "clinic", "doctors", "dentist"] },
  { id: "hardware", label: "Hardware & electrical", colour: "#57534e", tags: ["hardware", "electrical", "doityourself", "paint", "carpenter", "plumber"] },
  { id: "vehicles", label: "Vehicle & cycle services", colour: "#334155", tags: ["bicycle", "bicycle_repair", "car_repair", "car_parts", "motorcycle_repair", "motorcycle", "tyres", "fuel"] },
];

/** Places that draw people every day: footfall "anchors" next to a shop. */
export const ANCHOR_TAGS = ["school", "college", "university", "hospital", "clinic", "bank", "metro_station", "railway_station", "bus_station", "it_office", "company_office", "coworking_office", "marketplace"];

const OTHER_COLOUR = "#64748b";
const tagColour = new Map(BUSINESS_GROUPS.flatMap((group) => group.tags.map((tag) => [tag, group.colour] as const)));

export const colourFor = (category: string) =>
  tagColour.get(category) ?? (ANCHOR_TAGS.includes(category) ? "#0f5e57" : OTHER_COLOUR);

export function categoryLabel(tag: string) {
  const label = tag.replaceAll("_", " ").replaceAll(";", " / ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** A map filter: "" for every place, "group:food" for a business group, or a single OSM category. */
export function tagsForFilter(filter: string): string[] | null {
  if (!filter) return null;
  if (filter.startsWith("group:")) return BUSINESS_GROUPS.find((group) => `group:${group.id}` === filter)?.tags ?? [];
  return [filter];
}

export type Cell = { lat: number; lng: number; count: number; categories: Record<string, number>; landmark: string | null };
export type ComparedCell = Cell & { peers: number; share: number; anchors: number };

/**
 * Ranks ~1 km map squares for a business type: lowest share of that type first, then busiest.
 * Squares with fewer than 10 mapped places are skipped as too thin to compare.
 */
export function compareCells(cells: Cell[], tags: string[], minimum = 10): ComparedCell[] {
  return cells
    .filter((cell) => cell.count >= minimum)
    .map((cell) => {
      const peers = tags.reduce((sum, tag) => sum + (cell.categories[tag] ?? 0), 0);
      const anchors = ANCHOR_TAGS.reduce((sum, tag) => sum + (cell.categories[tag] ?? 0), 0);
      return { ...cell, peers, share: peers / cell.count, anchors };
    })
    .sort((a, b) => a.share - b.share || b.anchors - a.anchors || b.count - a.count);
}
