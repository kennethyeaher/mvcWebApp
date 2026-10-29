const restaurantController = {
  init: function () {
    const showAllButton = document.querySelector("#showAll");
    const showTopRatedButton = document.querySelector("#showTopRated");

    showAllButton.addEventListener("click", function () {
      const restaurants = restaurantModel.getAllRestaurants();
      restaurantView.displayRestaurants(restaurants);
    });

    showTopRatedButton.addEventListener("click", function () {
      const restaurants = restaurantModel.getTopRatedRestaurants();
      restaurantView.displayRestaurants(restaurants);
    });

    restaurantView.displayRestaurants(restaurantModel.getAllRestaurants());
  }
};

restaurantController.init();
