const restaurantView = {
  /** Render supplied restaurants and a count without applying business rules.
   * @param {object[]} restaurants Records returned by the Model.
   * @returns {void} Replaces the visible cards and result status.
   */
  displayRestaurants: function (restaurants) {
    const container = document.querySelector("#restaurantList");
    container.replaceChildren();
    document.querySelector("#resultCount").textContent =
      `${restaurants.length} ${restaurants.length === 1 ? "restaurant" : "restaurants"}`;

    if (restaurants.length === 0) {
      const message = document.createElement("div");
      message.className = "empty-state";
      const heading = document.createElement("h3");
      heading.textContent = "No restaurants found.";
      const hint = document.createElement("p");
      hint.textContent = "Try a different search or cuisine, or choose Show All to reset your filters.";
      message.append(heading, hint);
      container.append(message);
      return;
    }

    // Use textContent so restaurant text is never interpreted as HTML.
    for (const restaurant of restaurants) {
      const card = document.createElement("article");
      card.className = "restaurant-card";
      const cuisine = document.createElement("p");
      cuisine.className = "cuisine";
      cuisine.textContent = restaurant.cuisine;
      card.dataset.restaurantId = restaurant.id || "";
      const name = document.createElement("h3");
      name.textContent = restaurant.name;
      const details = document.createElement("div");
      details.className = "card-details";
      const rating = document.createElement("p");
      rating.textContent = `Rating: ${restaurant.rating.toFixed(1)}`;
      const price = document.createElement("p");
      price.textContent = `Price: ${restaurant.priceRange}`;
      details.append(rating, price);
      const save = document.createElement("button");
      save.type = "button";
      save.className = "save-button";
      save.dataset.saveId = restaurant.id || "";
      save.setAttribute("aria-pressed", String(restaurant.isSaved === true));
      save.setAttribute("aria-label", `${restaurant.isSaved ? "Unsave" : "Save"} ${restaurant.name}`);
      save.textContent = restaurant.isSaved ? "Saved" : "Save place";
      const top = document.createElement("div");
      top.className = "card-top";
      top.append(cuisine, save);
      card.append(top, name, details);
      container.append(card);
    }
  },

  /** Populate the cuisine control from Model options.
   * @param {string[]} cuisines Sorted cuisine names.
   * @returns {void} Rebuilds the select with an All cuisines default.
   */
  displayCuisines: function (cuisines) {
    const select = document.querySelector("#cuisineFilter");
    select.replaceChildren(new Option("All cuisines", ""));
    for (const cuisine of cuisines) {
      select.add(new Option(cuisine, cuisine));
    }
  },

  /** Expose the selected filter through visible styling and pressed state.
   * @param {string} filter Selected filter identifier.
   * @returns {void} Updates the three filter buttons.
   */
  displayActiveFilter: function (filter) {
    const buttons = { all: "showAll", topRated: "showTopRated", inexpensive: "showInexpensive" };
    for (const [name, id] of Object.entries(buttons)) {
      document.getElementById(id).setAttribute("aria-pressed", String(name === filter));
    }
  },

  /** Synchronize form controls after initialization, reset, or browser navigation.
   * @param {object} state Normalized search state.
   * @returns {void} Updates native input values and selected filter presentation.
   */
  displayQuery: function (state) {
    document.querySelector("#restaurantSearch").value = state.search;
    document.querySelector("#cuisineFilter").value = state.cuisine;
    document.querySelector("#sortOrder").value = state.sort;
    document.querySelector("#savedOnly").checked = state.savedOnly;
    this.displayActiveFilter(state.filter);
  },

  /** Present the total saved count without applying a saved filter.
   * @param {number} count Number of saved IDs supplied by the Model.
   * @returns {void} Updates the saved control label.
   */
  displaySavedCount: function (count) {
    document.querySelector("#savedLabel").textContent = `Saved only (${count})`;
  },

  /** Announce an action or recoverable failure as plain text.
   * @param {string} message Feedback for the live status region.
   * @returns {void} Replaces the existing message.
   */
  displayStatus: function (message) {
    document.querySelector("#actionStatus").textContent = message;
  },

  /** Expose a manual copy field only when the clipboard is unavailable.
   * @param {string} url Shareable search URL.
   * @returns {void} Reveals, focuses, and selects the fallback field.
   */
  displayShareFallback: function (url) {
    document.querySelector("#shareFallback").hidden = false;
    const field = document.querySelector("#shareLink");
    field.value = url;
    field.focus();
    field.select();
  },

  /** Remove a stale manual link when the query changes. */
  hideShareFallback: function () {
    document.querySelector("#shareFallback").hidden = true;
  },

  /** Return the focused save control ID, or an empty string for other controls. */
  getFocusedSaveId: function () {
    return document.activeElement.dataset.saveId || "";
  },

  /** Restore keyboard focus after saving replaces the card list.
   * @param {string} id Restaurant whose save control initiated the action.
   * @returns {void} Focuses its control or the saved filter if it disappeared.
   */
  restoreSaveFocus: function (id) {
    const button = [...document.querySelectorAll("[data-save-id]")].find((element) => element.dataset.saveId === id);
    (button || document.querySelector("#savedOnly")).focus();
  }
};
