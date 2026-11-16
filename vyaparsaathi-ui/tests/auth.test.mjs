import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/auth/password.ts";
import { createRateLimiter, validateCredentials } from "../lib/auth/validate.ts";

test("passwords are salted and verify correctly", async () => {
  const first = await hashPassword("momo-cart-2026");
  const second = await hashPassword("momo-cart-2026");
  assert.notEqual(first, second, "same password must give different hashes");
  assert.ok(first.startsWith("scrypt$"));
  assert.ok(!first.includes("momo-cart-2026"));
  assert.equal(await verifyPassword("momo-cart-2026", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
});

test("sign-up validation", () => {
  assert.equal(validateCredentials({ name: "Asha", email: "ASHA@Example.com ", password: "12345678" }, "register").value?.email, "asha@example.com");
  assert.equal(validateCredentials({ name: "Asha", email: "not-an-email", password: "12345678" }, "register").ok, false);
  assert.equal(validateCredentials({ name: "Asha", email: "a@b.co", password: "short" }, "register").ok, false);
  assert.equal(validateCredentials({ name: "A", email: "a@b.co", password: "12345678" }, "register").ok, false);
  assert.equal(validateCredentials({ email: "a@b.co", password: "x" }, "login").ok, true);
  assert.equal(validateCredentials(null, "login").ok, false);
});

test("rate limiter blocks after the limit inside the window", () => {
  const allow = createRateLimiter(2, 1000);
  assert.equal(allow("k", 0), true);
  assert.equal(allow("k", 10), true);
  assert.equal(allow("k", 20), false);
  assert.equal(allow("k", 1500), true, "window has passed");
});
