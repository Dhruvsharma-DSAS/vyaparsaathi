import "server-only";
import type { City } from "../types";
import { marketGap } from "./gap";
import { seedCities } from "./seed-data";
import type { MapArea, MapPayload, MapStation, MapWard } from "./types";

function withGap<T extends { placesFound: number; population: number; cityMedianPlacesPer10000: number }>(sample: T) {
  return { ...sample, ...marketGap(sample.placesFound, sample.population, sample.cityMedianPlacesPer10000) };
}

/** Reads one city's map layer from the Prisma database. */
async function fromDatabase(city: City): Promise<MapPayload | null> {
  const { prisma } = await import("../db");
  const row = await prisma.city.findUnique({
    where: { name: city },
    include: {
      supplyMarkets: { orderBy: { name: "asc" } },
      areas: {
        orderBy: { name: "asc" },
        include: { samples: { include: { supplyMarket: true }, orderBy: { category: "asc" } } },
      },
    },
  });
  if (!row) return null;
  const [wards, density, stations, placeCategories] = await Promise.all([
    prisma.ward.findMany({ where: { city }, include: { stats: true }, orderBy: { id: "asc" } }),
    prisma.densityCell.findMany({ where: { city }, select: { lat: true, lng: true, count: true, landmarkName: true } }),
    prisma.rushStation.findMany({ where: { city }, orderBy: { name: "asc" } }),
    prisma.place.groupBy({ by: ["category"], where: { city }, _count: { _all: true }, orderBy: { _count: { category: "desc" } }, take: 12 }),
  ]);
  return {
    city,
    center: [row.centerLat, row.centerLng],
    zoom: row.defaultZoom,
    source: "database",
    supplyMarkets: row.supplyMarkets.map(({ name, lat, lng }) => ({ name, lat, lng })),
    areas: row.areas.map((area): MapArea => ({
      name: area.name,
      lat: area.lat,
      lng: area.lng,
      approximate: area.approximate,
      samples: area.samples.map((sample) => withGap({
        category: sample.category,
        placesFound: sample.placesFound,
        population: sample.population,
        cityMedianPlacesPer10000: sample.cityMedianPlacesPer10000,
        supplyMarket: sample.supplyMarket?.name ?? null,
        supplyDistanceKm: sample.supplyDistanceKm,
        confidence: sample.confidence,
      })),
    })),
    wards: wards.map((ward): MapWard => {
      const best = ward.stats.filter((stat) => (stat.gap ?? 0) > 0).sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))[0];
      return {
        id: ward.id, name: ward.name, population: ward.population,
        geometry: (ward.geometry as unknown as GeoJSON.Geometry | null) ?? null,
        topGap: best ? { category: best.category, gap: best.gap ?? 0 } : null,
      };
    }),
    density: density.map((cell) => ({ lat: cell.lat, lng: cell.lng, count: cell.count, landmark: cell.landmarkName })),
    stations: stations.map((station): MapStation => {
      const curve = station.weekday as number[];
      const peakValue = Math.max(...curve);
      return { name: station.name, lat: station.lat, lng: station.lng, kind: station.kind, peakHour: curve.indexOf(peakValue), peakValue };
    }),
    placeCategories: placeCategories.map((item) => ({ category: item.category, count: item._count._all })),
  };
}

/** Same shape built straight from the seed rows, used when no database is available. */
function fromSeed(city: City): MapPayload | null {
  const seed = seedCities.find((item) => item.name === city);
  if (!seed) return null;
  return {
    city,
    center: seed.center,
    zoom: seed.zoom,
    source: "seed-fallback",
    supplyMarkets: seed.supplyMarkets,
    wards: [],
    density: [],
    stations: [],
    placeCategories: [],
    areas: seed.areas.map((area) => ({
      ...area,
      approximate: true,
      samples: seed.samples
        .filter((sample) => sample.area === area.name)
        .map((sample) => withGap({ ...sample, area: undefined })),
    })),
  };
}

export async function getCityMap(city: City): Promise<MapPayload | null> {
  try {
    const fromDb = await fromDatabase(city);
    if (fromDb) return fromDb;
  } catch (error) {
    console.warn("Map database unavailable, serving seed data:", (error as Error).message);
  }
  return fromSeed(city);
}
