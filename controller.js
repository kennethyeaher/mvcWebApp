const restaurantController = {
  state: {},
  storage: null,

  /** Connect query controls, saved places, browser navigation, and the Model. */
  init: function () {
    restaurantView.displayCuisines(restaurantModel.getCuisines());
    this.state = restaurantQuery.read(location.href);
    try { this.storage = window.localStorage; } catch { this.storage = null; }
    this.loadSaved();
    restaurantView.displayQuery(this.state);

    document.querySelector("#showAll").addEventListener("click", () => {
      this.state = restaurantModel.normalizeQuery();
      restaurantView.displayQuery(this.state);
      this.updateRestaurants();
    });
    for (const [id, filter] of [["showTopRated", "topRated"], ["showInexpensive", "inexpensive"]]) {
      document.getElementById(id).addEventListener("click", () => {
        this.state.filter = filter;
        this.updateRestaurants();
      });
    }
    for (const [id, property, eventName] of [
      ["cuisineFilter", "cuisine", "change"], ["restaurantSearch", "search", "input"],
      ["sortOrder", "sort", "change"], ["savedOnly", "savedOnly", "change"]
    ]) {
      document.getElementById(id).addEventListener(eventName, (event) => {
        this.state[property] = property === "savedOnly" ? event.target.checked : event.target.value;
        this.updateRestaurants();
      });
    }
    document.querySelector("#restaurantList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-save-id]");
      if (button) this.saveRestaurant(button.dataset.saveId);
    });
    document.querySelector("#shareSearch").addEventListener("click", () => this.shareSearch());
    window.addEventListener("popstate", () => {
      this.state = restaurantQuery.read(location.href);
      restaurantView.displayQuery(this.state);
      this.updateRestaurants();
    });
    window.addEventListener("storage", (event) => {
      if (event.storageArea === this.storage && (event.key === restaurantStorage.key || event.key === null)) {
        const focusedId = restaurantView.getFocusedSaveId();
        this.loadSaved();
        this.updateRestaurants();
        if (focusedId) restaurantView.restoreSaveFocus(focusedId);
      }
    });
    this.updateRestaurants();
  },

  /** Restore persisted IDs through the Model's validation boundary. */
  loadSaved: function () {
    const saved = restaurantStorage.load(this.storage);
    restaurantModel.restoreSaved(saved.ids);
    if (saved.message) restaurantView.displayStatus(saved.message);
  },

  /** Query the Model, update presentation, and keep the search URL current. */
  updateRestaurants: function () {
    restaurantView.displayRestaurants(restaurantModel.findRestaurants(this.state));
    restaurantView.displayActiveFilter(this.state.filter);
    restaurantView.displaySavedCount(restaurantModel.getSavedIds().length);
    restaurantView.hideShareFallback();
    // File URLs and restricted history access must not stop local filtering.
    try { history.replaceState(null, "", restaurantQuery.build(location.href, this.state)); } catch { /* Filtering remains available. */ }
  },

  /** Toggle a restaurant and keep working when storage is blocked or full.
   * @param {string} id Stable restaurant ID from a rendered save button.
   * @returns {void} Updates saved state, feedback, results, and keyboard focus.
   */
  saveRestaurant: function (id) {
    const isSaved = restaurantModel.toggleSaved(id);
    const persisted = restaurantStorage.save(this.storage, restaurantModel.getSavedIds());
    this.updateRestaurants();
    const restaurant = restaurantModel.restaurants.find((entry) => entry.id === id);
    if (!restaurant) return;
    restaurantView.displayStatus(`${isSaved ? "Saved" : "Removed"} ${restaurant.name}.${persisted ? "" : " Changes apply to this visit only. Browser storage could not be updated."}`);
    restaurantView.restoreSaveFocus(id);
  },

  /** Copy a shareable search URL or provide a manual copy field on failure. */
  shareSearch: async function () {
    if (!/^https?:$/.test(location.protocol)) {
      restaurantView.displayStatus("Open the live demo to share this search.");
      return;
    }
    const url = restaurantQuery.build(location.href, this.state);
    try {
      await navigator.clipboard.writeText(url);
      if (restaurantQuery.build(location.href, this.state) !== url) return;
      restaurantView.displayStatus("Search link copied. Saved places are not included.");
    } catch {
      if (restaurantQuery.build(location.href, this.state) !== url) return;
      restaurantView.displayShareFallback(url);
      restaurantView.displayStatus("Clipboard access is unavailable. Copy the selected link instead.");
    }
  }
};

restaurantController.init();
