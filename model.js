const restaurantModel = {
  restaurants: [
    { name: "Milano's", cuisine: "Italian", rating: 4.5 },
    { name: "Sakura Sushi", cuisine: "Japanese", rating: 4.2 },
    { name: "The Brass Elephant", cuisine: "American", rating: 4.8 },
    { name: "Pho Corner", cuisine: "Vietnamese", rating: 4.3 },
    { name: "Tandoor Palace", cuisine: "Indian", rating: 4.1 }
  ],

  getAllRestaurants: function () {
    return this.restaurants;
  },

  getTopRatedRestaurants: function () {
    return this.restaurants.filter(function (restaurant) {
      return restaurant.rating >= 4.5;
    });
  }
};
