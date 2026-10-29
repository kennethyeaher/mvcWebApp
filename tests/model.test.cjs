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
