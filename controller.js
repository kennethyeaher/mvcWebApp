const restaurantController = {
  selectedFilter: "all",
  selectedCuisine: "",

  /** Wire user actions to Model queries and the existing View renderer. */
  init: function () {
    restaurantView.displayCuisines(restaurantModel.getCuisines());
    document.querySelector("#showAll").addEventListener("click", () => {
      this.selectedFilter = "all";
      this.selectedCuisine = "";
      document.querySelector("#cuisineFilter").value = "";
      this.updateRestaurants();
    });
    document.querySelector("#showTopRated").addEventListener("click", () => {
      this.selectedFilter = "topRated";
      this.updateRestaurants();
    });
    document.querySelector("#showInexpensive").addEventListener("click", () => {
      this.selectedFilter = "inexpensive";
      this.updateRestaurants();
    });
    document.querySelector("#cuisineFilter").addEventListener("change", (event) => {
      this.selectedCuisine = event.target.value;
      this.updateRestaurants();
    });
    this.updateRestaurants();
  },

  /** Request matching records and synchronize the result and selected button. */
  updateRestaurants: function () {
    const restaurants = restaurantModel.getFilteredRestaurants(
      this.selectedFilter, this.selectedCuisine
    );
    restaurantView.displayRestaurants(restaurants);
    restaurantView.displayActiveFilter(this.selectedFilter);
  }
};

restaurantController.init();
