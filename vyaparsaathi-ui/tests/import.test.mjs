import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "../prisma/import-data.ts";

test("CSV parser handles quotes, commas and newlines inside fields", () => {
  const rows = parseCsv('id,name,note\r\n1,"Shree Sagar, CTR","said ""best"" dosa"\n2,Plain,"two\nlines"\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { id: "1", name: "Shree Sagar, CTR", note: 'said "best" dosa' });
  assert.equal(rows[1].note, "two\nlines");
});

test("CSV parser keeps empty fields", () => {
  const [row] = parseCsv("a,b,c\n1,,3\n");
  assert.deepEqual(row, { a: "1", b: "", c: "3" });
});
