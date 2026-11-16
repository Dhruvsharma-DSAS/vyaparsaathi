import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/data → row counts and provenance for every imported dataset. */
export async function GET() {
  try {
    const [sources, counts] = await Promise.all([
      prisma.datasetSource.findMany({ orderBy: { key: "asc" }, select: { key: true, file: true, rows: true, sha256: true, description: true, importedAt: true } }),
      Promise.all([
        prisma.place.count(), prisma.weatherHour.count(), prisma.ward.count(), prisma.densityCell.count(),
        prisma.rushStation.count(), prisma.businessType.count(), prisma.recipe.count(), prisma.scheme.count(),
        prisma.licence.count(), prisma.cityEvent.count(), prisma.mandiPrice.count(), prisma.boundaryFile.count(),
      ]),
    ]);
    const labels = ["Places", "Weather hours", "Wards", "Density cells", "Rush stations", "Business types", "Recipes", "Schemes", "Licences", "Events", "Mandi prices", "Boundary files"];
    return NextResponse.json({ tables: labels.map((label, index) => ({ label, rows: counts[index] })), sources });
  } catch {
    return NextResponse.json({ error: "Database is not set up. Run npm run db:setup." }, { status: 503 });
  }
}
