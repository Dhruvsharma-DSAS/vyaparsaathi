import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedCities } from "../lib/map/seed-data";
import { importAll } from "./import-data";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/map.db" }),
});

async function main() {
  for (const city of seedCities) {
    const savedCity = await prisma.city.upsert({
      where: { name: city.name },
      update: { centerLat: city.center[0], centerLng: city.center[1], defaultZoom: city.zoom },
      create: { name: city.name, centerLat: city.center[0], centerLng: city.center[1], defaultZoom: city.zoom },
    });

    const areaIds = new Map<string, number>();
    for (const area of city.areas) {
      const saved = await prisma.area.upsert({
        where: { cityId_name: { cityId: savedCity.id, name: area.name } },
        update: { lat: area.lat, lng: area.lng },
        create: { ...area, cityId: savedCity.id },
      });
      areaIds.set(area.name, saved.id);
    }

    const marketIds = new Map<string, number>();
    for (const market of city.supplyMarkets) {
      const saved = await prisma.supplyMarket.upsert({
        where: { cityId_name: { cityId: savedCity.id, name: market.name } },
        update: { lat: market.lat, lng: market.lng },
        create: { ...market, cityId: savedCity.id },
      });
      marketIds.set(market.name, saved.id);
    }

    for (const sample of city.samples) {
      const areaId = areaIds.get(sample.area);
      if (!areaId) throw new Error(`Sample references unknown area ${sample.area}`);
      const data = {
        placesFound: sample.placesFound,
        population: sample.population,
        cityMedianPlacesPer10000: sample.cityMedianPlacesPer10000,
        supplyDistanceKm: sample.supplyDistanceKm,
        confidence: sample.confidence,
        supplyMarketId: sample.supplyMarket ? marketIds.get(sample.supplyMarket) ?? null : null,
      };
      await prisma.marketSample.upsert({
        where: { areaId_category: { areaId, category: sample.category } },
        update: data,
        create: { ...data, areaId, category: sample.category },
      });
    }
    console.log(`Seeded ${city.name}: ${city.areas.length} areas, ${city.samples.length} samples`);
  }
}

main()
  .then(() => importAll(prisma))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
