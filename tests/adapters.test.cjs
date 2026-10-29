const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = ["model.js", "persistence.js", "query-state.js"].map((name) => fs.readFileSync(name, "utf8")).join("\n");
const { storage, query } = vm.runInNewContext(`${source}; ({ storage: restaurantStorage, query: restaurantQuery })`, { URL });

/** Provide a small Storage substitute for adapter boundary tests. */
function memoryStorage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (key, next) => { value = next; }, removeItem: () => { value = null; } };
}

test("saved data round trips and an empty list removes the stored entry", () => {
  const adapter = memoryStorage();
  assert.equal(storage.load(adapter).ids.length, 0);
  assert.equal(storage.save(adapter, ["milanos"]), true);
  assert.equal(storage.load(adapter).ids.join(","), "milanos");
  assert.equal(storage.save(adapter, []), true);
  assert.equal(adapter.getItem(), null);
});

test("invalid JSON schemas and inaccessible storage never crash the app", () => {
  for (const raw of ["{broken", "null", '{"version":9,"ids":[]}', '{"version":1,"ids":[3]}']) {
    assert.equal(storage.load(memoryStorage(raw)).ids.length, 0);
    assert.ok(storage.load(memoryStorage(raw)).message);
  }
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("quota"); }, removeItem() { throw Error("blocked"); } };
  assert.equal(storage.load(blocked).available, false);
  assert.equal(storage.save(blocked, ["milanos"]), false);
  assert.equal(storage.save(blocked, []), false);
});

test("search links round trip Unicode and omit private saved state", () => {
  const href = query.build("https://example.test/app/?source=course#results", { search: "Pho & café", cuisine: "Vietnamese", filter: "inexpensive", sort: "price", savedOnly: true, savedIds: ["milanos"] });
  const restored = query.read(href);
  assert.equal(restored.search, "Pho & café");
  assert.equal(restored.cuisine, "Vietnamese");
  assert.equal(restored.filter, "inexpensive");
  assert.equal(restored.sort, "price");
  assert.equal(restored.savedOnly, false);
  assert.ok(href.includes("source=course"));
  assert.ok(href.endsWith("#results"));
  assert.ok(!href.includes("saved"));
  assert.ok(!href.includes("milanos"));
});

test("invalid URL choices fall back safely and defaults remove stale query fields", () => {
  const restored = query.read("https://example.test/?sort=bad&filter=bad&cuisine=Unknown");
  assert.equal(restored.sort, "recommended");
  assert.equal(restored.filter, "all");
  assert.equal(restored.cuisine, "");
  assert.equal(query.build("https://example.test/?sort=price&q=old&cuisine=Italian&filter=inexpensive", {}), "https://example.test/");
});
