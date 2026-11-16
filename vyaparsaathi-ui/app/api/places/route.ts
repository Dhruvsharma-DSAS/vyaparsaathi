import { NextResponse, type NextRequest } from "next/server";
import { cities } from "@/lib/config";
import { prisma } from "@/lib/db";
import { tagsForFilter } from "@/lib/map/groups";
import type { City } from "@/lib/types";

export const runtime = "nodejs";

const MAX_LIMIT = 3000;

/**
 * GET /api/places?city=Pune&filter=group:food&bbox=south,west,north,east&limit=2500
 * Mapped places (OpenStreetMap snapshot) inside the visible map area.
 * filter: "" = every place, "group:<id>" = a business group, otherwise one OSM category.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const city = params.get("city");
  if (!city || !cities.includes(city as City)) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }
  const filter = params.get("filter") ?? params.get("category") ?? "";
  const tags = tagsForFilter(filter);
  const limit = Math.min(Math.max(Number(params.get("limit")) || 1500, 1), MAX_LIMIT);
  const box = (params.get("bbox") ?? "").split(",").map(Number);
  const hasBox = box.length === 4 && box.every(Number.isFinite);

  const where = {
    city,
    ...(tags ? { category: { in: tags } } : {}),
    ...(hasBox ? { lat: { gte: box[0], lte: box[2] }, lng: { gte: box[1], lte: box[3] } } : {}),
  };
  const [places, inView, cityTotal] = await Promise.all([
    prisma.place.findMany({
      where,
      select: { id: true, name: true, category: true, lat: true, lng: true, openingHours: true, cuisine: true, sourceUrl: true },
      take: limit,
      // OSM ids are spread across the city, so a capped sample still covers the whole view.
      orderBy: { id: "asc" },
    }),
    prisma.place.count({ where }),
    prisma.place.count({ where: { city, ...(tags ? { category: { in: tags } } : {}) } }),
  ]);
  return NextResponse.json(
    { places, inView, cityTotal, shown: places.length, license: "ODbL-1.0 · © OpenStreetMap contributors" },
    { headers: { "Cache-Control": "public, max-age=120" } },
  );
}
