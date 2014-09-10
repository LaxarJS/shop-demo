# Final Steps
The only tasks left to do are adding the OrderActivity and the HeadlineWidget to the application and adjust the second page to our needs.

## OrderActivity
The OrderActivity listens to the `takeActionRequest` event of the ShoppingCartWidget as intent to submit the order to some imaginary order system.
In our example we simply put the order into our PouchDB backend.
If this is successful the activity publishes a `didTakeAction` using the outcome `SUCCESS` and otherwise using outcome `ERROR`.


![Step 4](img/step4.png)


If the order is successfully placed, our application should navigate to the second page named `finish_order.json`.
To achieve this the activity has to publish a `navigateRequest` event using a configured target that is navigated to.
This target has to exist as a target for our active place in the flow.

[shop_demo/includes/widgets/shop_demo/order_activity/order_activity.js:](../../includes/widgets/shop_demo/order_activity/order_activity.js#L42)
```javascript
$scope.eventBus.publish( 'navigateRequest.' + features.order.target, {
   target : features.order.target,
   data: {}
} );
```

Excerpt from `application/flow.json`:
```json
{
   "places": {
     "finishOrder": {
         "page":  "finish_order"
      }
   }
}
```

And the page where we configure the target:
[shop_demo/application/pages/shop_demo.json:](../../application/pages/shop_demo.json#L5)
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
The second page only uses and configures the already existing HeadlineWidget.
Just fetch it from our github repository.

[shop_demo/application/pages/finish_order.json](../../application/pages/finish_order.json)

[shop_demo/includes/widgets/shop_demo/headline_widget](../../includes/widgets/shop_demo/headline_widget)

Now we start the server with `npm start` again and visit it at [http://localhost:8000/debug.html](http://localhost:8000/debug.html).
When placing an order we now navigate to the second page we just created.

## Finish
The application is completed and we can compile an optimized version ready for deployment:
```shell
grunt dist
```

Start the server with `npm start` and visit the [http://localhost:8000/index.html](http://localhost:8000/index.html).

## Next Step
Go ahead and Develop your own application!

[<< ShoppingCartWidget](shopping_cart_widget.md)  | Final steps  
