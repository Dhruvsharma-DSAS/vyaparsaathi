/**
 * Refreshes prisma/data/real/business_pois.csv from OpenStreetMap (Overpass API).
 *
 *   npm run data:fetch      # downloads, then run `npm run db:seed` to load it
 *
 * Same source and columns as the original D-vyparsathi collector, with more
 * business-relevant place types (ATMs, clinics, hotels, craft workshops, offices,
 * metro/rail/bus stations). Every row keeps its OSM id, edit time, licence and source URL.
 * Data © OpenStreetMap contributors, ODbL-1.0.
 */
import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "prisma", "data", "real");
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const ROUNDS = Number(process.env.OSM_FETCH_ROUNDS ?? 6); // retry rounds across all servers
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const USER_AGENT = "VyaparSaathi-data-refresh/1.0 (public OpenStreetMap snapshot)";

// south,west,north,east — same areas as the original collector (city plus suburbs).
export const CITY_BOXES: Record<string, string> = {
  bengaluru: "12.75,77.35,13.20,77.85",
  pune: "18.35,73.65,18.75,74.05",
};

const AMENITIES = [
  "restaurant", "cafe", "fast_food", "food_court", "ice_cream", "marketplace", "bank", "atm",
  "school", "college", "university", "hospital", "clinic", "doctors", "dentist", "pharmacy",
  "bus_station", "cinema", "fuel",
];
const CRAFTS = ["tailor", "shoemaker", "carpenter", "electrician", "plumber", "key_cutter", "photographer", "upholsterer"];
const TOURISM = ["hotel", "guest_house", "hostel"];
const OFFICES = ["company", "it", "coworking", "government"];

const anyOf = (values: string[]) => `^(${values.join("|")})$`;

/** Smaller queries per city are far less likely to time out on busy public servers. */
export function overpassQueries(bbox: string) {
  const wrap = (body: string) => `[out:json][timeout:180];(${body});out center meta;`;
  return {
    shops: wrap(`nwr["shop"](${bbox});`),
    amenities: wrap(`nwr["amenity"~"${anyOf(AMENITIES)}"](${bbox});`),
    other: wrap(
      `nwr["craft"~"${anyOf(CRAFTS)}"](${bbox});` +
      `nwr["tourism"~"${anyOf(TOURISM)}"](${bbox});` +
      `nwr["office"~"${anyOf(OFFICES)}"](${bbox});` +
      `nwr["railway"~"^(station|halt)$"](${bbox});`,
    ),
  };
}

type Element = {
  type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number };
  tags?: Record<string, string>; version?: number; timestamp?: string;
};

/** Maps OSM tags to the app's category and kind. Returns null for elements we don't keep. */
export function classify(tags: Record<string, string>): { category: string; kind: string } | null {
  if (tags.shop) return { category: tags.shop, kind: "shop" };
  if (tags.amenity && AMENITIES.includes(tags.amenity)) return { category: tags.amenity, kind: "amenity" };
  if (tags.craft && CRAFTS.includes(tags.craft)) return { category: tags.craft, kind: "craft" };
  if (tags.tourism && TOURISM.includes(tags.tourism)) return { category: tags.tourism, kind: "tourism" };
  if (tags.office && OFFICES.includes(tags.office)) return { category: tags.office === "it" ? "it_office" : `${tags.office}_office`, kind: "office" };
  if (tags.railway === "station" || tags.railway === "halt") {
    const metro = tags.station === "subway" || tags.station === "light_rail" || /metro|namma/i.test(tags.network ?? "");
    return { category: metro ? "metro_station" : "railway_station", kind: "transport" };
  }
  return null;
}

const COLUMNS = [
  "record_id", "city", "name", "category", "category_kind", "latitude", "longitude", "opening_hours", "cuisine",
  "wheelchair", "osm_version", "source_updated_at", "retrieved_at_utc", "source_url", "license", "data_kind",
] as const;
type Row = Record<(typeof COLUMNS)[number], string>;

export function toCsv(rows: Row[]) {
  const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);
  return [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((column) => cell(row[column] ?? "")).join(","))].join("\n") + "\n";
}

async function runQuery(label: string, query: string) {
  const errors: string[] = [];
  for (let round = 1; round <= ROUNDS; round++) {
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(200_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { elements?: Element[]; osm3s?: { timestamp_osm_base?: string }; remark?: string };
        if (data.remark && /runtime error|timed out|out of memory/i.test(data.remark)) throw new Error(data.remark);
        console.log(`  ${label}: ${data.elements?.length ?? 0} elements from ${new URL(endpoint).host}`);
        return { elements: data.elements ?? [], endpoint, osmBase: data.osm3s?.timestamp_osm_base ?? null };
      } catch (error) {
        errors.push(`${new URL(endpoint).host}: ${(error as Error).message}`);
      }
    }
    if (round < ROUNDS) {
      const wait = 30_000 * round;
      console.log(`  ${label}: all servers busy (round ${round}/${ROUNDS}), retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw new Error(`Could not download ${label}: ${errors.slice(-ENDPOINTS.length).join("; ")}`);
}

async function fetchCity(city: string, bbox: string) {
  const elements: Element[] = [];
  const sources = [];
  for (const [part, query] of Object.entries(overpassQueries(bbox))) {
    const result = await runQuery(`${city}/${part}`, query);
    elements.push(...result.elements);
    sources.push({ city, part, endpoint: result.endpoint, bbox, source_timestamp: result.osmBase, query });
    await sleep(5_000); // be polite to shared public servers
  }
  return { elements, sources };
}

async function main() {
  const retrieved = new Date().toISOString();
  const rows: Row[] = [];
  const seen = new Set<string>();
  const sources = [];
  for (const [city, bbox] of Object.entries(CITY_BOXES)) {
    const fetched = await fetchCity(city, bbox);
    const elements = fetched.elements;
    sources.push(...fetched.sources);
    for (const element of elements) {
      const id = `${element.type}/${element.id}`;
      const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null);
      const kind = classify(element.tags ?? {});
      if (seen.has(id) || !point || !kind) continue;
      seen.add(id);
      const tags = element.tags ?? {};
      rows.push({
        record_id: id, city, name: tags.name ?? tags["name:en"] ?? "", category: kind.category, category_kind: kind.kind,
        latitude: String(point.lat), longitude: String(point.lon), opening_hours: tags.opening_hours ?? "",
        cuisine: tags.cuisine ?? "", wheelchair: tags.wheelchair ?? "", osm_version: String(element.version ?? ""),
        source_updated_at: element.timestamp ?? "", retrieved_at_utc: retrieved,
        source_url: `https://www.openstreetmap.org/${id}`, license: "ODbL-1.0", data_kind: "mapped_poi_snapshot",
      });
    }
    console.log(`${city}: ${rows.filter((row) => row.city === city).length} places`);
  }
  // Same safety check as the original collector: never replace good data with a partial download.
  if (rows.length <= 10_000) throw new Error(`Only ${rows.length} places received; keeping the existing file.`);

  const csv = toCsv(rows);
  const target = path.join(DATA_DIR, "business_pois.csv");
  writeFileSync(`${target}.tmp`, csv);
  renameSync(`${target}.tmp`, target);

  const manifestPath = path.join(DATA_DIR, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { datasets: Record<string, unknown>; generated_at_utc?: string };
  manifest.datasets.pois = {
    file: "business_pois.csv", rows: rows.length, sha256: createHash("sha256").update(csv).digest("hex"), columns: COLUMNS,
    sources, unique_key: "record_id", data_kind: "mapped_poi_snapshot",
    limitations: "OSM coverage is incomplete. Bounding boxes include suburbs. Object edit time is not field verification. Nodes and polygons may describe the same business.",
  };
  manifest.generated_at_utc = retrieved;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Saved ${rows.length} places. Run "npm run db:seed" to load them into the database.`);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("prisma", "fetch-osm.ts"))) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
