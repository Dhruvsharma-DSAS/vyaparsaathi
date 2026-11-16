import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { createRateLimiter, validateCredentials } from "@/lib/auth/validate";

export const runtime = "nodejs";
const allow = createRateLimiter(10, 15 * 60 * 1000);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`register:${ip}`)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const parsed = validateCredentials(await request.json().catch(() => null), "register");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, email, password } = parsed.value;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: { name: name!, email, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true },
  });
  await startSession(user.id);
  return NextResponse.json({ user, plan: null }, { status: 201 });
}
