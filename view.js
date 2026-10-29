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
      hint.textContent = "Try another cuisine or choose Show All to reset your filters.";
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
      const name = document.createElement("h3");
      name.textContent = restaurant.name;
      const details = document.createElement("div");
      details.className = "card-details";
      const rating = document.createElement("p");
      rating.textContent = `Rating: ${restaurant.rating.toFixed(1)}`;
      const price = document.createElement("p");
      price.textContent = `Price: ${restaurant.priceRange}`;
      details.append(rating, price);
      card.append(cuisine, name, details);
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
  }
};
