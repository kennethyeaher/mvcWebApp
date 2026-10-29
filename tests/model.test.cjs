const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("model.js", "utf8");
const model = vm.runInNewContext(`${source}; restaurantModel`);

test("every starter record has a valid price and the data covers three ranges", () => {
  assert.equal(model.restaurants.length, 5);
  assert.equal(new Set(model.restaurants.map((restaurant) => restaurant.priceRange)).size, 3);
  assert.ok(model.restaurants.every((restaurant) => ["$", "$$", "$$$"].includes(restaurant.priceRange)));
});

test("inexpensive and top rated rules return the expected restaurants", () => {
  assert.equal(model.getInexpensiveRestaurants().map((restaurant) => restaurant.name).join(","), "Pho Corner,Tandoor Palace");
  assert.equal(model.getTopRatedRestaurants().map((restaurant) => restaurant.name).join(","), "Milano's,The Brass Elephant");
});

test("cuisine search is reusable and unknown cuisines produce no matches", () => {
  for (const cuisine of model.getCuisines()) {
    assert.ok(model.getRestaurantsByCuisine(cuisine).every((restaurant) => restaurant.cuisine === cuisine));
    assert.equal(model.getRestaurantsByCuisine(cuisine).length, 1);
  }
  assert.equal(model.getRestaurantsByCuisine("Unknown").length, 0);
});

test("combined choices support matching and empty results without mutating records", () => {
  const before = JSON.stringify(model.restaurants);
  assert.equal(model.getFilteredRestaurants("inexpensive", "Italian").length, 0);
  assert.equal(model.getFilteredRestaurants("inexpensive", "Indian").length, 1);
  assert.equal(model.getFilteredRestaurants("topRated", "Italian").length, 1);
  assert.equal(model.getFilteredRestaurants("all", "").length, 5);
  model.getAllRestaurants().pop();
  assert.equal(JSON.stringify(model.restaurants), before);
});


test("search and sort combine with required filters without changing source records", () => {
  const before = JSON.stringify(model.restaurants);
  assert.equal(model.findRestaurants({search: "  PHO  "})[0].name, "Pho Corner");
  assert.equal(model.findRestaurants({search: "Japanese"})[0].name, "Sakura Sushi");
  assert.equal(model.findRestaurants({search: "Italian", filter: "inexpensive"}).length, 0);
  assert.equal(model.findRestaurants({sort: "rating"})[0].rating, 4.8);
  assert.equal(model.findRestaurants({sort: "price"}).map((restaurant) => restaurant.priceRange).join(","), "$,$,$$,$$,$$$");
  assert.equal(model.findRestaurants({sort: "name"})[0].name, "Milano's");
  assert.equal(model.findRestaurants({sort: "invalid"})[0].name, "Milano's");
  assert.equal(JSON.stringify(model.restaurants), before);
});

test("saved selection rejects unknown IDs and survives query reset", () => {
  model.restoreSaved(["milanos", "milanos", "untrusted-id", 42]);
  assert.equal(model.getSavedIds().join(","), "milanos");
  assert.equal(model.findRestaurants({savedOnly: true})[0].isSaved, true);
  assert.equal(model.toggleSaved("milanos"), false);
  assert.equal(model.findRestaurants({savedOnly: true}).length, 0);
  assert.equal(model.toggleSaved("pho-corner"), true);
  assert.equal(model.findRestaurants(model.normalizeQuery()).length, 5);
  assert.equal(model.getSavedIds().join(","), "pho-corner");
  model.toggleSaved("untrusted-id");
  assert.equal(model.getSavedIds().length, 1);
  model.restoreSaved(null);
  assert.equal(model.getSavedIds().length, 0);
});

test("external query values use bounded validated defaults", () => {
  const query = model.normalizeQuery({search: "x".repeat(500), cuisine: "Unknown", filter: "injected", sort: "injected", savedOnly: "true"});
  assert.equal(query.search.length, 120);
  assert.equal(query.cuisine, "");
  assert.equal(query.filter, "all");
  assert.equal(query.sort, "recommended");
  assert.equal(query.savedOnly, false);
});
