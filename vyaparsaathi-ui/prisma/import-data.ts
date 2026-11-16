/**
 * Loads every dataset in prisma/data/ (copied from the D-vyparsathi project) into Prisma.
 * Each table is cleared and reloaded, so running it again gives the same result.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Prisma, PrismaClient } from "../lib/generated/prisma/client";

// Run from the vyaparsaathi-ui folder (npm run db:setup / db:seed do this).
const DATA_DIR = path.join(process.cwd(), "prisma", "data");
const cityKeys = { bengaluru: "Bengaluru", pune: "Pune" } as const;
type CityKey = keyof typeof cityKeys;

const read = (file: string) => readFileSync(path.join(DATA_DIR, file), "utf8");
const json = <T>(file: string): T => JSON.parse(read(file)) as T;
const cityName = (key: string) => cityKeys[key as CityKey] ?? (key === "both" ? "Both" : key);
const optional = (value: string | undefined) => (value === undefined || value === "" ? null : value);

/** RFC 4180 CSV parser (handles quoted fields, commas and newlines inside quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

async function inBatches<T>(items: T[], size: number, write: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) await write(items.slice(i, i + size));
}

async function importPlaces(prisma: PrismaClient) {
  const file = "real/business_pois.csv";
  const text = read(file);
  const rows = parseCsv(text);
  const data: Prisma.PlaceCreateManyInput[] = rows.map((r) => ({
    id: r.record_id,
    city: cityName(r.city),
    name: optional(r.name),
    category: r.category,
    categoryKind: r.category_kind,
    lat: Number(r.latitude),
    lng: Number(r.longitude),
    openingHours: optional(r.opening_hours),
    cuisine: optional(r.cuisine),
    wheelchair: optional(r.wheelchair),
    osmVersion: Number(r.osm_version),
    sourceUpdatedAt: new Date(r.source_updated_at),
    retrievedAt: new Date(r.retrieved_at_utc),
    sourceUrl: r.source_url,
    license: r.license,
    dataKind: r.data_kind,
  }));
  await prisma.place.deleteMany();
  await inBatches(data, 2000, (batch) => prisma.place.createMany({ data: batch }));
  return { file, rows: data.length, sha256: createHash("sha256").update(text).digest("hex") };
}

async function importWeather(prisma: PrismaClient) {
  const file = "real/weather_hourly.csv";
  const text = read(file);
  const data: Prisma.WeatherHourCreateManyInput[] = parseCsv(text).map((r) => ({
    id: r.record_id,
    city: cityName(r.city),
    timestampLocal: r.timestamp_local,
    timezone: r.timezone,
    lat: Number(r.latitude),
    lng: Number(r.longitude),
    temperatureC: Number(r.temperature_c),
    relativeHumidityPct: Number(r.relative_humidity_pct),
    precipitationMm: Number(r.precipitation_mm),
    windSpeedKmh: Number(r.wind_speed_kmh),
    retrievedAt: new Date(r.retrieved_at_utc),
    sourceUrl: r.source_url,
    license: r.license,
    dataKind: r.data_kind,
  }));
  await prisma.weatherHour.deleteMany();
  await inBatches(data, 2000, (batch) => prisma.weatherHour.createMany({ data: batch }));
  return { file, rows: data.length, sha256: createHash("sha256").update(text).digest("hex") };
}

type WardStats = {
  medians_per10k: Record<string, number>;
  wards: Array<{
    ward_id: string; name: string; population: number; area_km2: number; lat: number; lng: number;
    counts: Record<string, number>; per10k?: Record<string, number>; gap?: Record<string, number>;
    confidence?: string; sources?: string[];
  }>;
};
type GeoJson = { features: Array<{ properties: Record<string, unknown>; geometry: unknown }> };

async function importWards(prisma: PrismaClient) {
  await prisma.wardCategoryStat.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.categoryMedian.deleteMany();
  let wards = 0;
  for (const key of Object.keys(cityKeys) as CityKey[]) {
    const stats = json<WardStats>(`city/${key}/ward_stats.json`);
    const shapes = json<GeoJson>(`city/${key}/wards.geojson`);
    const geometryById = new Map(shapes.features.map((f) => [String(f.properties.ward_id), f]));
    await prisma.ward.createMany({
      data: stats.wards.map((w) => {
        const shape = geometryById.get(w.ward_id);
        return {
          id: w.ward_id, city: cityKeys[key], name: w.name, population: w.population,
          popSource: (shape?.properties.pop_source as string | undefined) ?? null,
          areaKm2: w.area_km2, lat: w.lat, lng: w.lng, confidence: w.confidence ?? null,
          sources: w.sources ?? undefined, geometry: (shape?.geometry as Prisma.InputJsonValue | undefined) ?? undefined,
        };
      }),
    });
    const categoryRows = stats.wards.flatMap((w) => Object.entries(w.counts).map(([category, count]) => ({
      wardId: w.ward_id, category, count, per10k: w.per10k?.[category] ?? null, gap: w.gap?.[category] ?? null,
    })));
    await inBatches(categoryRows, 1000, (batch) => prisma.wardCategoryStat.createMany({ data: batch }));
    await prisma.categoryMedian.createMany({
      data: Object.entries(stats.medians_per10k).map(([category, medianPer10k]) => ({ city: cityKeys[key], category, medianPer10k })),
    });
    wards += stats.wards.length;
  }
  return wards;
}

type RushFile = Record<string, { name: string; lat: number; lng: number; kind: string; weekday: number[]; weekend: number[]; source?: string }>;

async function importRush(prisma: PrismaClient) {
  await prisma.rushStation.deleteMany();
  const data = (Object.keys(cityKeys) as CityKey[]).flatMap((key) =>
    Object.values(json<RushFile>(`city/${key}/rush_clock.json`)).map((s) => ({
      city: cityKeys[key], name: s.name, lat: s.lat, lng: s.lng, kind: s.kind,
      weekday: s.weekday, weekend: s.weekend, source: s.source ?? null,
    })));
  await prisma.rushStation.createMany({ data });
  return data.length;
}

type CityMapFile = {
  density: Array<{ lat: number; lng: number; count: number; categories: Record<string, number>; landmark?: { name?: string; category?: string; source_url?: string } }>;
};

async function importDensity(prisma: PrismaClient) {
  await prisma.densityCell.deleteMany();
  const data = (Object.keys(cityKeys) as CityKey[]).flatMap((key) =>
    json<CityMapFile>(`real/${key}_map.json`).density.map((cell) => ({
      city: cityKeys[key], lat: cell.lat, lng: cell.lng, count: cell.count, categories: cell.categories,
      landmarkName: cell.landmark?.name ?? null, landmarkCategory: cell.landmark?.category ?? null,
      landmarkUrl: cell.landmark?.source_url ?? null,
    })));
  await inBatches(data, 1000, (batch) => prisma.densityCell.createMany({ data: batch }));
  return data.length;
}

type RecipeFile = Record<string, { name: string; items: Array<{ name: string; grams?: number; retail_per_kg?: number; mandi?: string; fixed?: number }> }>;
type BusinessFile = Array<{
  id: string; name: string; hindi?: string; model: string; category: string; skills: string[]; peak?: string;
  price: number; unit?: string; recipe?: string; typical_units_per_day?: number; monthly_fixed?: number;
  startup: unknown[]; licences?: string[]; schemes?: string[];
}>;

async function importCatalogue(prisma: PrismaClient) {
  const recipes = json<RecipeFile>("common/recipes.json");
  const businesses = json<BusinessFile>("common/business_types.json");
  const schemes = json<Array<Record<string, unknown>>>("common/schemes.json");
  const licences = json<Array<Record<string, unknown>>>("common/licences.json");
  const events = json<Array<{ name: string; city: string; month: number; effect: string }>>("common/events.json");

  await prisma.businessType.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.licence.deleteMany();
  await prisma.cityEvent.deleteMany();

  await prisma.recipe.createMany({ data: Object.entries(recipes).map(([id, r]) => ({ id, name: r.name })) });
  await prisma.recipeItem.createMany({
    data: Object.entries(recipes).flatMap(([recipeId, r]) => r.items.map((item, position) => ({
      recipeId, position, name: item.name, grams: item.grams ?? null, retailPerKg: item.retail_per_kg ?? null,
      mandiItem: item.mandi ?? null, fixedCost: item.fixed ?? null,
    }))),
  });
  await prisma.businessType.createMany({
    data: businesses.map((b) => ({
      id: b.id, name: b.name, hindi: b.hindi ?? null, model: b.model, category: b.category, skills: b.skills,
      peak: b.peak ?? null, price: b.price, unit: b.unit ?? null,
      recipeId: b.recipe && recipes[b.recipe] ? b.recipe : null,
      typicalUnitsPerDay: b.typical_units_per_day ?? null, monthlyFixed: b.monthly_fixed ?? null,
      startup: b.startup as Prisma.InputJsonValue, licenceIds: b.licences ?? [], schemeIds: b.schemes ?? [],
    })),
  });
  const text = (value: unknown) => (typeof value === "string" ? value : null);
  await prisma.scheme.createMany({
    data: schemes.map((s) => ({
      id: String(s.id), name: String(s.name), forModels: (s.for_models as string[]) ?? [], forText: text(s.for_text),
      maxAmount: typeof s.max_amount === "number" ? s.max_amount : null, detail: text(s.detail),
      needs: (s.needs as string[]) ?? [], url: text(s.url), checkedOn: text(s.checked_on), sourceUrl: text(s.source_url),
    })),
  });
  await prisma.licence.createMany({
    data: licences.map((l) => ({
      id: String(l.id), name: String(l.name), why: text(l.why), where: text(l.where), url: text(l.url),
      time: text(l.time), checkedOn: text(l.checked_on), sourceUrl: text(l.source_url),
    })),
  });
  await prisma.cityEvent.createMany({ data: events.map((e) => ({ ...e, city: cityName(e.city) })) });
  return { businesses: businesses.length, recipes: Object.keys(recipes).length, schemes: schemes.length, licences: licences.length, events: events.length };
}

type MandiFile = { date: string; sample?: boolean; last_month?: Record<string, number> } & Record<string, unknown>;
type NewsFile = { date: string; sample?: boolean } & Record<string, unknown>;

async function importDaily(prisma: PrismaClient) {
  const mandi = json<MandiFile>("daily/mandi_today.json");
  const news = json<NewsFile>("daily/news_today.json");
  await prisma.mandiPrice.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.newsDigest.deleteMany();

  const prices = (Object.keys(cityKeys) as CityKey[]).flatMap((key) =>
    Object.entries((mandi[key] as Record<string, number>) ?? {}).map(([commodity, pricePerKg]) => ({
      date: mandi.date, city: cityKeys[key], commodity, pricePerKg, period: "today", sample: Boolean(mandi.sample),
    })));
  // last_month is not split by city in the source file, so it is stored under "Both".
  const lastMonth = Object.entries(mandi.last_month ?? {}).map(([commodity, pricePerKg]) => ({
    date: mandi.date, city: "Both", commodity, pricePerKg, period: "last_month", sample: Boolean(mandi.sample),
  }));
  await prisma.mandiPrice.createMany({ data: [...prices, ...lastMonth] });

  let headlines = 0;
  for (const key of Object.keys(cityKeys) as CityKey[]) {
    const digest = news[key] as { summary: string; items: Array<{ title: string; tag?: string }> } | undefined;
    if (!digest) continue;
    await prisma.newsDigest.create({
      data: {
        date: news.date, city: cityKeys[key], summary: digest.summary, sample: Boolean(news.sample),
        items: { create: digest.items.map((item) => ({ title: item.title, tag: item.tag ?? null })) },
      },
    });
    headlines += digest.items.length;
  }
  return { prices: prices.length + lastMonth.length, headlines };
}

async function importBoundaries(prisma: PrismaClient) {
  const files = [
    { name: "blr.geojson", region: "Bengaluru wards (KGIS)" },
    { name: "pune_wards.geojson", region: "Pune electoral wards" },
    { name: "pune_admin.geojson", region: "Pune administrative wards" },
    { name: "india.geojson", region: "India districts (2011)" },
  ];
  await prisma.boundaryFile.deleteMany();
  for (const file of files) {
    const geojson = read(`raw/${file.name}`);
    await prisma.boundaryFile.create({
      data: { ...file, geojson, featureCount: (JSON.parse(geojson) as GeoJson).features.length },
    });
  }
  return files.length;
}

export async function importAll(prisma: PrismaClient) {
  const started = Date.now();
  const places = await importPlaces(prisma);
  const weather = await importWeather(prisma);
  const wards = await importWards(prisma);
  const rush = await importRush(prisma);
  const density = await importDensity(prisma);
  const catalogue = await importCatalogue(prisma);
  const daily = await importDaily(prisma);
  const boundaries = await importBoundaries(prisma);

  // Provenance: the original manifest and summary, plus what was actually loaded.
  const manifest = json<{ datasets: Record<string, { sha256?: string }> } & Record<string, unknown>>("real/manifest.json");
  const summary = json<Record<string, unknown>>("real/summary.json");
  await prisma.datasetSource.deleteMany();
  await prisma.datasetSource.createMany({
    data: [
      { key: "pois", file: places.file, rows: places.rows, sha256: places.sha256, description: "OpenStreetMap places snapshot (ODbL-1.0)", meta: { manifest: manifest.datasets.pois, summary } as Prisma.InputJsonValue },
      { key: "weather", file: weather.file, rows: weather.rows, sha256: weather.sha256, description: "ERA5 hourly weather via Open-Meteo (CC-BY-4.0)", meta: manifest.datasets.weather as Prisma.InputJsonValue },
      { key: "wards", file: "city/*/ward_stats.json + wards.geojson", rows: wards, description: "Ward population, boundaries and category counts" },
      { key: "rush", file: "city/*/rush_clock.json", rows: rush, description: "Station rush curves (sample shapes)" },
      { key: "density", file: "real/*_map.json", rows: density, description: "Map density grid from the places snapshot" },
      { key: "catalogue", file: "common/*.json", rows: catalogue.businesses, description: "Business types, recipes, schemes, licences and events", meta: catalogue },
      { key: "daily", file: "daily/*.json", rows: daily.prices + daily.headlines, description: "Sample mandi prices and news digest", meta: daily },
      { key: "boundaries", file: "raw/*.geojson", rows: boundaries, description: "Raw boundary GeoJSON files" },
    ],
  });
  await prisma.modelReport.deleteMany();
  await prisma.modelReport.create({ data: { name: "weather_next_hour", report: json<Prisma.InputJsonValue>("real/weather_report.json") } });

  console.log(`Imported ${places.rows} places, ${weather.rows} weather hours, ${wards} wards, ${rush} stations, ${density} density cells, ` +
    `${catalogue.businesses} business types, ${catalogue.recipes} recipes, ${daily.prices} mandi prices, ${boundaries} boundary files ` +
    `in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
