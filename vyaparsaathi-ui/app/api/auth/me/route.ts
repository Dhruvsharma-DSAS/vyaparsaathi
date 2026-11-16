import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/** The signed-in user and their saved plan, or { user: null }. */
export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ user: null, plan: null });
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } });
  return NextResponse.json({ user, plan: row?.plan ?? null }, { headers: { "Cache-Control": "no-store" } });
}
