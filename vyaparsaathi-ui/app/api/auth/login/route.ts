import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { createRateLimiter, validateCredentials } from "@/lib/auth/validate";

export const runtime = "nodejs";
const allow = createRateLimiter(10, 15 * 60 * 1000);

export async function POST(request: NextRequest) {
  const parsed = validateCredentials(await request.json().catch(() => null), "login");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { email, password } = parsed.value;
  if (!allow(`login:${email}`)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
  }
  await startSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, plan: user.plan ?? null });
}
