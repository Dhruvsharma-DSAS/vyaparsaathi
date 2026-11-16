import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedPath } from "../lib/proxy-path.ts";

// composeDraft lives in a client component; this copy is kept identical and checked against it below.
function composeDraft(draft, transcript) {
  if (!transcript) return draft;
  if (!draft) return transcript;
  return /\s$/.test(draft) ? draft + transcript : `${draft} ${transcript}`;
}

test("typing keeps spaces (the space-key bug)", () => {
  assert.equal(composeDraft("I have ", ""), "I have ");
  assert.equal(composeDraft("hello  world ", ""), "hello  world ");
  assert.equal(composeDraft("", "namaste"), "namaste");
  assert.equal(composeDraft("I want", "a momo cart"), "I want a momo cart");
  assert.equal(composeDraft("I want ", "a momo cart"), "I want a momo cart");
});

test("composeDraft copy matches the component source", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../components/screens/AdvisorScreen.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!transcript\) return draft;/);
  assert.match(source, /\/\\s\$\/\.test\(draft\) \? draft \+ transcript : `\$\{draft\} \$\{transcript\}`/);
});

test("proxy forwards only the API's own routes", () => {
  assert.equal(isAllowedPath(["health"]), true);
  assert.equal(isAllowedPath(["api", "chat-loop"]), true);
  assert.equal(isAllowedPath(["api", "city", "weather"]), true);
  assert.equal(isAllowedPath(["docs"]), false);
  assert.equal(isAllowedPath(["api"]), false);
  assert.equal(isAllowedPath([]), false);
  assert.equal(isAllowedPath(["api", "..", "admin"]), false);
  assert.equal(isAllowedPath(["api", "a/b"]), false);
  assert.equal(isAllowedPath(["http:", "", "evil.example"]), false);
});
