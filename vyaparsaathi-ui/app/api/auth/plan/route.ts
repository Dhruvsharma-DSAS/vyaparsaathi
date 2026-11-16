import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
const MAX_BYTES = 512 * 1024;

/** PUT /api/auth/plan saves the signed-in user's plan snapshot to their account. */
export async function PUT(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const text = await request.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "Plan is too large" }, { status: 413 });
  let plan: unknown;
  try {
    plan = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof plan !== "object" || plan === null || Array.isArray(plan)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { plan: plan as object, planUpdatedAt: new Date() } });
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
