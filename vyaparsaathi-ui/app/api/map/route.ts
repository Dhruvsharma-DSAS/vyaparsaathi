import { NextResponse, type NextRequest } from "next/server";
import { cities } from "@/lib/config";
import { getCityMap } from "@/lib/map/service";
import type { City } from "@/lib/types";

export const runtime = "nodejs";

/** GET /api/map?city=Bengaluru → areas, coordinates, market samples and supply markets. */
export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  if (!city || !cities.includes(city as City)) {
    return NextResponse.json({ error: `city must be one of: ${cities.join(", ")}` }, { status: 400 });
  }
  const payload = await getCityMap(city as City);
  if (!payload) return NextResponse.json({ error: "No map data for this city" }, { status: 404 });
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=300" } });
}
