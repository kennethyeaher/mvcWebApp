const restaurantModel = {
  // Keep the course sample data and price rules together.
  restaurants: [
    { name: "Milano's", cuisine: "Italian", rating: 4.5, priceRange: "$$" },
    { name: "Sakura Sushi", cuisine: "Japanese", rating: 4.2, priceRange: "$$" },
    { name: "The Brass Elephant", cuisine: "American", rating: 4.8, priceRange: "$$$" },
    { name: "Pho Corner", cuisine: "Vietnamese", rating: 4.3, priceRange: "$" },
    { name: "Tandoor Palace", cuisine: "Indian", rating: 4.1, priceRange: "$" }
  ],

  /** Return a copy of all restaurant records. */
  getAllRestaurants: function () {
    return this.restaurants.slice();
  },

  /** Return restaurants rated at least 4.5. */
  getTopRatedRestaurants: function () {
    return this.restaurants.filter(function (restaurant) {
      return restaurant.rating >= 4.5;
    });
  },

  /** Return restaurants in the inexpensive price range. */
  getInexpensiveRestaurants: function () {
    return this.restaurants.filter(function (restaurant) {
      return restaurant.priceRange === "$";
    });
  },

  /** Return exact cuisine matches; an unknown cuisine returns an empty array.
   * @param {string} cuisine Cuisine stored in a restaurant record.
   * @returns {object[]} Matching restaurants.
   */
  getRestaurantsByCuisine: function (cuisine) {
    return this.restaurants.filter(function (restaurant) {
      return restaurant.cuisine === cuisine;
    });
  },

  /** Return sorted cuisine options derived from the current records. */
  getCuisines: function () {
    return [...new Set(this.restaurants.map(function (restaurant) {
      return restaurant.cuisine;
    }))].sort();
  },

  /** Combine a named filter with an optional cuisine in the Model.
   * @param {string} filter One of all, topRated, or inexpensive.
   * @param {string} cuisine Exact cuisine, or an empty string for all cuisines.
   * @returns {object[]} Records matching both choices.
   */
  getFilteredRestaurants: function (filter, cuisine) {
    const candidates = cuisine
      ? this.getRestaurantsByCuisine(cuisine)
      : this.getAllRestaurants();
    const allowed = filter === "inexpensive"
      ? this.getInexpensiveRestaurants()
      : filter === "topRated"
        ? this.getTopRatedRestaurants()
        : this.getAllRestaurants();
    return candidates.filter(function (restaurant) {
      return allowed.includes(restaurant);
    });
  }
};
