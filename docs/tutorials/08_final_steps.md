# Final Steps
The only tasks left to do are adding the OrderActivity to the application and adjust the second page to our needs.

## OrderActivity
The OrderActivity listens to the `takeActionRequest` event of the ShoppingCartWidget as intent to submit the order to some imaginary order system.
In our example we simply put the order into our PouchDB backend.
The order is based on the `cart/orders` resource published by the ShoppingCartWidget.
If the order is successfully placed the activity publishes a `didTakeAction` using the outcome `SUCCESS` and otherwise using outcome `ERROR`.
The OrderActivity is an activity instead of a widget because it doesn't have DOM objects. It acts with the PouchDB backend and with the ShoppingCartWidget but not with the user directly.


![Step 8](img/step8.png)

The base files for the OrderActivity can be created by the `grunt-init laxar-activity` script.
If the order is successfully placed, our application should navigate to the second page named `finish_order.json`.
To achieve this the activity has to publish a [`navigateRequest` event](../../includes/widgets/shop_demo/order_activity/order_activity.js#L42) using a configured target that is navigated to.


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
      "widget": "shop_demo/order_activity",
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

## Second Page
The second page [FinishOrder](../../application/pages/finish_order.json) only uses and configures the already existing HeadlineWidget.

Now we start the server with `npm start` again and visit the application.
When placing an order we navigate to the second page now.

## Themeing

The CSS files that we have written for our widgets and layouts only cover the basics that are necessary for displaying our application.
For a more sophisticated styling, we add a [Bootstrap](http://getbootstrap.com) based _theme_ under `includes/themes/laxar_demo.theme`.
The LaxarJS documentation contains a [manual on themes](//github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes) based on this shop demo, which goes into more detail.


## Finish
The application is completed and we can compile an optimized version ready for deployment:
```shell
grunt dist
```

Start the server with `npm start` and visit the [static version](http://localhost:8000/index.html) (change the port to the one of step 1).

## The Next Step
Go ahead and Develop your own application!

[<< ShoppingCartWidget](07_shopping_cart_widget.md)  | Final steps
