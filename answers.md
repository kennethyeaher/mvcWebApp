# MVC answers

## Why priceRange belongs in the Model

The price range describes a restaurant, so it belongs with the other restaurant data in the Model. Keeping it there also lets the inexpensive filter use the same data that the View displays.

## 1. What problem does MVC help solve?

MVC helps prevent data rules, interface markup, and event handling from becoming one tangled block of code. In this app, I can change the inexpensive restaurant rule in the Model without rewriting how the cards are displayed. That separation makes each responsibility easier to understand and test.

## 2. Why should the Controller not contain restaurant.rating >= 4.5?

That comparison defines what the app considers top rated, which is a business rule owned by the Model. If I put it in the Controller, another feature could copy the rule and eventually use a different threshold. The Controller should request top rated restaurants and pass the returned records to the View.

## 3. If cards were replaced with a table, which component would change most?

The View would change most because it creates the visible restaurant layout. I would replace the card markup with table rows and update the related styles. The Model could return the same records, and the Controller could still call displayRestaurants().

## 4. Does MVC require three separate JavaScript files?

MVC requires separate responsibilities, but it does not require exactly three files. One file can still follow MVC if the data rules, rendering, and coordination remain clearly separated. Separate files make those boundaries easier to see in this assignment.

## 5. If data came from a REST API, which component should manage it?

The Model should manage retrieving restaurant data from the API and making it available to the rest of the app. The Controller would coordinate the request and tell the View when to show loading, results, or a failure message. Keeping the request out of the View would let me change the data source without rebuilding the restaurant cards.

## MVC Detective

The event listener filters the Model's raw records and defines the rating threshold inside the Controller. I would move that rule into getTopRatedRestaurants() in the Model, then let the Controller request the filtered records.

```js
// model.js
const restaurantModel = {
  restaurants: [/* restaurant records */],

  /** Return restaurants rated at least 4.5. */
  getTopRatedRestaurants: function () {
    return this.restaurants.filter(function (restaurant) {
      return restaurant.rating >= 4.5;
    });
  }
};

// controller.js
showTopRatedButton.addEventListener("click", function () {
  const restaurants = restaurantModel.getTopRatedRestaurants();
  restaurantView.displayRestaurants(restaurants);
});
```

The submitted app keeps this rule in the same Model method. Its Controller also tracks cuisine and passes both selections to getFilteredRestaurants(), which combines the filters in the Model.
