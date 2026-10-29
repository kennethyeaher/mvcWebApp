// Search URLs intentionally exclude saved IDs and the device specific saved filter.
const restaurantQuery = {
  /** Read shareable choices from an untrusted URL.
   * @param {string} href Absolute page URL.
   * @returns {object} Query choices validated by the Model.
   */
  read: function (href) {
    const parameters = new URL(href).searchParams;
    return restaurantModel.normalizeQuery({
      search: parameters.get("q"), cuisine: parameters.get("cuisine"),
      filter: parameters.get("filter"), sort: parameters.get("sort")
    });
  },

  /** Build a shareable URL while retaining unrelated parameters and the hash.
   * @param {string} href Current page URL.
   * @param {object} state Current query choices.
   * @returns {string} Canonical URL with default choices omitted.
   */
  build: function (href, state) {
    const url = new URL(href);
    const query = restaurantModel.normalizeQuery(state);
    const parameters = { q: query.search.trim(), cuisine: query.cuisine,
      filter: query.filter === "all" ? "" : query.filter,
      sort: query.sort === "recommended" ? "" : query.sort };
    for (const [key, value] of Object.entries(parameters)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    return url.href;
  }
};
