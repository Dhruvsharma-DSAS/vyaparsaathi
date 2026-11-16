import assert from "node:assert/strict";
import test from "node:test";
import { classify, overpassQueries, toCsv } from "../prisma/fetch-osm.ts";
import { buildDensityCells, parseCsv } from "../prisma/import-data.ts";
import { compareCells, tagsForFilter, colourFor, categoryLabel } from "../lib/map/groups.ts";

test("OSM tags map to app categories", () => {
  assert.deepEqual(classify({ shop: "bakery" }), { category: "bakery", kind: "shop" });
  assert.deepEqual(classify({ amenity: "atm" }), { category: "atm", kind: "amenity" });
  assert.deepEqual(classify({ craft: "tailor" }), { category: "tailor", kind: "craft" });
  assert.deepEqual(classify({ office: "it" }), { category: "it_office", kind: "office" });
  assert.deepEqual(classify({ railway: "station", station: "subway" }), { category: "metro_station", kind: "transport" });
  assert.deepEqual(classify({ railway: "station" }), { category: "railway_station", kind: "transport" });
  assert.equal(classify({ amenity: "bench" }), null, "unrelated amenities are skipped");
  assert.equal(classify({}), null);
});

test("Overpass queries are split per group and keep the city box", () => {
  const queries = overpassQueries("12.75,77.35,13.20,77.85");
  assert.deepEqual(Object.keys(queries), ["shops", "amenities", "other"]);
  for (const query of Object.values(queries)) assert.match(query, /\(12\.75,77\.35,13\.20,77\.85\)/);
});

test("CSV writer round-trips through the importer's parser", () => {
  const row = {
    record_id: "node/1", city: "pune", name: 'Shree "Sagar", CTR', category: "restaurant", category_kind: "amenity",
    latitude: "18.5", longitude: "73.8", opening_hours: "Mo-Su 07:00-22:00", cuisine: "south_indian;coffee", wheelchair: "",
    osm_version: "3", source_updated_at: "2026-01-01T00:00:00Z", retrieved_at_utc: "2026-11-16T00:00:00Z",
    source_url: "https://www.openstreetmap.org/node/1", license: "ODbL-1.0", data_kind: "mapped_poi_snapshot",
  };
  const [parsed] = parseCsv(toCsv([row]));
  assert.deepEqual(parsed, row);
});

test("density grid uses 0.01° squares and prefers school/hospital landmarks", () => {
  const cells = buildDensityCells([
    { city: "Pune", lat: 18.5012, lng: 73.8015, category: "cafe", name: "Chai Point", sourceUrl: "a" },
    { city: "Pune", lat: 18.5088, lng: 73.8099, category: "school", name: "City School", sourceUrl: "b" },
    { city: "Pune", lat: 18.5121, lng: 73.8015, category: "cafe", name: null, sourceUrl: "c" },
  ]);
  assert.equal(cells.length, 2);
  const first = cells.find((cell) => cell.count === 2);
  assert.deepEqual(first.categories, { cafe: 1, school: 1 });
  assert.equal(first.landmarkName, "City School");
  assert.ok(Math.abs(first.lat - 18.505) < 1e-9 && Math.abs(first.lng - 73.805) < 1e-9);
});

test("opportunity ranking: busy squares with the lowest share first", () => {
  const cells = [
    { lat: 1, lng: 1, count: 40, categories: { restaurant: 10, school: 2 }, landmark: "A" },
    { lat: 2, lng: 2, count: 50, categories: { restaurant: 1, hospital: 3 }, landmark: "B" },
    { lat: 3, lng: 3, count: 5, categories: {}, landmark: "C" },
  ];
  const ranked = compareCells(cells, tagsForFilter("group:food"), 30);
  assert.deepEqual(ranked.map((cell) => cell.landmark), ["B", "A"]);
  assert.equal(ranked[0].peers, 1);
  assert.equal(ranked[0].anchors, 3);
});

test("filters, colours and labels", () => {
  assert.equal(tagsForFilter(""), null);
  assert.ok(tagsForFilter("group:pharmacy").includes("pharmacy"));
  assert.deepEqual(tagsForFilter("bakery"), ["bakery"]);
  assert.match(colourFor("restaurant"), /^#/);
  assert.equal(categoryLabel("mobile_phone_repair"), "Mobile phone repair");
});
