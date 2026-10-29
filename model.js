const restaurantModel = {
  savedIds: new Set(),

  // Keep the course sample data and price rules together.
  restaurants: [
    { id: "milanos", name: "Milano's", cuisine: "Italian", rating: 4.5, priceRange: "$$" },
    { id: "sakura-sushi", name: "Sakura Sushi", cuisine: "Japanese", rating: 4.2, priceRange: "$$" },
    { id: "brass-elephant", name: "The Brass Elephant", cuisine: "American", rating: 4.8, priceRange: "$$$" },
    { id: "pho-corner", name: "Pho Corner", cuisine: "Vietnamese", rating: 4.3, priceRange: "$" },
    { id: "tandoor-palace", name: "Tandoor Palace", cuisine: "Indian", rating: 4.1, priceRange: "$" }
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
  },

  /** Normalize filter input from controls or a shared URL.
   * @param {object} options Untrusted query values.
   * @returns {object} Validated choices with safe defaults.
   */
  normalizeQuery: function (options = {}) {
    return {
      filter: ["all", "topRated", "inexpensive"].includes(options.filter) ? options.filter : "all",
      cuisine: this.getCuisines().includes(options.cuisine) ? options.cuisine : "",
      search: typeof options.search === "string" ? options.search.slice(0, 120) : "",
      sort: ["recommended", "rating", "price", "name"].includes(options.sort) ? options.sort : "recommended",
      savedOnly: options.savedOnly === true
    };
  },

  /** Search, filter, and sort without changing the source array.
   * @param {object} options Query choices, normalized before use.
   * @returns {object[]} Matching records with their saved state.
   */
  findRestaurants: function (options = {}) {
    const query = this.normalizeQuery(options);
    const term = query.search.trim().toLocaleLowerCase();
    const matches = this.getFilteredRestaurants(query.filter, query.cuisine).filter((restaurant) => {
      const matchesSearch = `${restaurant.name} ${restaurant.cuisine}`.toLocaleLowerCase().includes(term);
      return matchesSearch && (!query.savedOnly || this.savedIds.has(restaurant.id));
    });
    const comparators = {
      rating: (first, second) => second.rating - first.rating || first.name.localeCompare(second.name),
      price: (first, second) => first.priceRange.length - second.priceRange.length || second.rating - first.rating || first.name.localeCompare(second.name),
      name: (first, second) => first.name.localeCompare(second.name)
    };
    if (comparators[query.sort]) matches.sort(comparators[query.sort]);
    return matches.map((restaurant) => ({ ...restaurant, isSaved: this.savedIds.has(restaurant.id) }));
  },

  /** Restore only known restaurant IDs from a saved array.
   * @param {unknown} ids Stored data, which may be malformed.
   * @returns {void} Replaces the current saved selection.
   */
  restoreSaved: function (ids) {
    const knownIds = new Set(this.restaurants.map((restaurant) => restaurant.id));
    this.savedIds = new Set(Array.isArray(ids) ? ids.filter((id) => knownIds.has(id)) : []);
  },

  /** Toggle a known restaurant without accepting arbitrary stored IDs.
   * @param {string} id Stable restaurant ID.
   * @returns {boolean} Whether the restaurant is now saved.
   */
  toggleSaved: function (id) {
    if (!this.restaurants.some((restaurant) => restaurant.id === id)) return false;
    if (this.savedIds.has(id)) this.savedIds.delete(id);
    else this.savedIds.add(id);
    return this.savedIds.has(id);
  },

  /** Return a serializable copy of the saved restaurant IDs. */
  getSavedIds: function () {
    return [...this.savedIds];
  }
};
