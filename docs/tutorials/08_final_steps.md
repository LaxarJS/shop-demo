# Final Steps

The only tasks left are adding the _OrderActivity_ to the application and having the second page show a confirmation message.
In this final part of the tutorial, you will also learn how to create an optimized version of your application for production.


## OrderActivity

The OrderActivity listens to the `takeActionRequest` event of the ShoppingCartWidget as intent to submit the order to some imaginary order system.
In our example we simply put the order into our PouchDB backend.
The order is based on the `cart/orders` resource published by the ShoppingCartWidget.
If the order is successfully placed the activity publishes a `didTakeAction` using the outcome `SUCCESS` and otherwise using outcome `ERROR`.
The OrderActivity is an activity instead of a widget because it does not need to access DOM objects or provide any visual representation.
It interacts with the PouchDB backend and with the ShoppingCartWidget, but not with the user directly.

![Step 8](img/step8.png)

The base files for the OrderActivity can be created by the `grunt-init laxar-activity` script.
If the order is successfully placed, our application should navigate to the second page named `finish_order.json`.
To achieve this, the activity has to publish a [`navigateRequest` event](../../includes/widgets/shop-demo/order-activity/order-activity.js#L37) using a configured target that is navigated to.


```javascript
$scope.eventBus.publish( 'navigateRequest.' + features.order.target, {
   target : features.order.target,
   data: {}
} );
```

This target has to exist as a target for our active place in the [flow](../../application/flow/flow.json):

```json
{
   "places": {
      "entry": {
         "redirectTo": "shopDemo"
      },

      "shopDemo": {
         "page":  "shop_demo"
      },

      "finishOrder": {
         "page":  "finish_order"
      }
   }
}
```

And the [page](../../application/pages/shop_demo.json#L5) where we configure the target:

```json
"activities": [
   {
      "widget": "shop-demo/order-activity",
      "features": {
         "cart": {
            "resource": "cart"
         },
         "order":{
            "action": "order",
            "target": "finishOrder"
         },
         "database":{
            "pouchDb": {
               "dbId": "orders"
            }
         }
      }
   }
],
```


## The Second Page

The second page [FinishOrder](../../application/pages/finish_order.json) uses and configures only the HeadlineWidget, which is already available.

Now we start the server with `npm start` again and visit the application.
By "placing" an order we can now navigate to the confirmation page.


## Theming Widgets and Layouts

The CSS files that we have written for our widgets and layouts only cover the basics that are necessary for displaying our application.
For a more sophisticated styling, we add a [Bootstrap](http://getbootstrap.com) based _theme_ under `includes/themes/cube.theme`.
The LaxarJS documentation contains a [manual on themes](//github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes) based on this shop demo, which goes into more detail.


## Deploying the Application

The application is completed and we can compile an _optimized version_ ready for deployment:

```shell
npm run-script optimize
```

Start the server with `npm start` and visit the [static version](http://localhost:8000/index.html) (change the port to the one of step 1).


## The Next Step

Go ahead and Develop your own application!
Check out the [LaxarJS Manuals](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/index.md#manuals) for more information, and get familiar with the [LaxarJS Patterns](https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md#laxarjs-patterns) to learn how to create the best and most reusable widgets.

[« The ShoppingCartWidget](07_shopping_cart_widget.md)  | Final steps
