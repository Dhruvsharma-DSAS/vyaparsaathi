/** Shared sign-up / sign-in checks (used by the API routes and unit tests). */

export const PASSWORD_MIN = 8;

export type Credentials = { name?: string; email: string; password: string };

export function normaliseEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function validateCredentials(body: unknown, mode: "register" | "login"): { ok: true; value: Credentials } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid request" };
  const input = body as Record<string, unknown>;
  const email = normaliseEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address" };
  if (mode === "register") {
    if (name.length < 2 || name.length > 80) return { ok: false, error: "Enter your name (2–80 characters)" };
    if (password.length < PASSWORD_MIN) return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters` };
  }
  if (!password || password.length > 200) return { ok: false, error: "Enter your password" };
  return { ok: true, value: { name, email, password } };
}

/** Very small in-memory limiter: at most `limit` attempts per key per window. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length <= limit;
  };
}
