import { NextResponse, type NextRequest } from "next/server";
import { cities } from "@/lib/config";
import { prisma } from "@/lib/db";
import type { City } from "@/lib/types";

export const runtime = "nodejs";

/** GET /api/places?city=Pune&category=cafe&limit=400 → mapped places from the OpenStreetMap snapshot. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const city = params.get("city");
  const category = params.get("category");
  const limit = Math.min(Math.max(Number(params.get("limit")) || 300, 1), 1000);
  if (!city || !cities.includes(city as City) || !category) {
    return NextResponse.json({ error: "city and category are required" }, { status: 400 });
  }
  const [places, total] = await Promise.all([
    prisma.place.findMany({ where: { city, category }, select: { id: true, name: true, category: true, lat: true, lng: true }, take: limit, orderBy: { id: "asc" } }),
    prisma.place.count({ where: { city, category } }),
  ]);
  return NextResponse.json({ places, total, license: "ODbL-1.0 · © OpenStreetMap contributors" });
}
