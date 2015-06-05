# The ShoppingCartWidget

The next step for our ShopDemo application is to implement the _ShoppingCartWidget_.
It will display the cart with all added articles and lets the user change the order quantity for each article.
You will learn how widgets can manage their representation of a resource's state using helpers provided by the [LaxarJS Patterns](https://github.com/LaxarJS/laxar_patterns) library, and how they may communicate modifications through incremental updates.


![Step 7](img/step7.png)

The ShoppingCartWidget publishes the cart (list of orders) as a resource and triggers an action when the user tries to order.
It receives the selected article and listens to the `addArticle` action event.
If the action is triggered the widget adds the selected article to cart and publishes the updated cart.


## Appearance of the ShoppingCartWidget

This is what the final ShoppingCartWidget will look like:

![ShoppingCartWidget](img/shopping_cart_widget.png)

The ShoppingCartWidget has a headline, a table with the cart and with buttons for increase or decrease the quantity of an article and a button for ordering the cart.


## Features of the ShoppingCartWidget

In detail the widget has three things to do.
First it has to subscribe to changes of the selected article and the `takeActionRequest` event, that expresses the intent of the user to add the article to the cart.
Next the widget has to manage the cart with the list of all added articles and has to display them.
The user has to be able to change the quantity and delete articles from the shopping cart completely.
Finally every change of the cart must be published as a resource on the EventBus to provide a current representation of the shopping cart contents to other widgets.
The responsibility of this widget is to manage the shopping cart content but not the process of ordering the items itself.
We will see that missing piece later in the last part of this tutorial.

For this we divide the tasks into three features *article*, *display* and *cart*.


### Displaying the Shopping Cart Articles

The widget has to display the shopping cart contents.
The necessary labels with their defaults are described in the [widget definition](../../includes/widgets/shop-demo/shopping-cart-widget/widget.json), so that it is possible to configure custom labels when adding the widget to a page or to use the defaults.
If the shopping cart is empty the widget will display a hint with the html content configured under the path `features.display.htmlNoItemsText`.


### Adding an Article to the Cart

This feature is the glue that consolidates the selection of an article in the ArticleBrowserWidget with the `takeActionRequest` event send as instruction to add the article to the cart.
Hence it's possible to configure the name of the resource resembling the article selection and one or more actions that trigger the addition of that article to the cart.


### Publishing the Order

This feature is used to configure the name of the resource representing the the shopping cart contents to be ordered.
Under this name the order is published via a `didReplace` event.
Additionally the widget publishes a `takeActionRequest` to actually request ordering the articles.


### Implementation

The [features definition](../../includes/widgets/shop-demo/shopping-cart-widget/widget.json) of the ShoppingCartWidget is similar to the definition of the other widgets.

In the [controller](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L30) we add two resource helpers for the cart resource:

```javascript
var updatePublisherForCart = patterns.resources.updatePublisherForFeature( $scope, 'cart' );
var updateHandlerForCart = patterns.resources.updateHandler( $scope, 'cart' );
```

There is a handler for processing received updates, allowing other widgets to modify the shopping cart contents:

```javascript
$scope.eventBus.subscribe( 'didUpdate.cart', updateHandlerForCart );
```

Additionally there is a _publisher_ to [generate incremental updates](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L59):

```javascript
updatePublisherForCart.compareAndPublish( oldCart, resources.cart );
```

The object [`oldCart`](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L56) is a clone of the resource which is used for comparison when generating updates.
For the creation we use the recursive [`deepClone`](https://github.com/LaxarJS/laxar/blob/master/docs/api/lib/utilities/object.md#deepclone-obj-) function of LaxarJS.
```javascript
var oldCart = ax.object.deepClone( resources.cart );
```

The method `compareAndPublish` of the updates-publisher creates patches in [JSON Patch](http://tools.ietf.org/html/rfc6902) format and publishes them as `didUpdate` event on the EventBus.
For the initial publishing or to replace the resource completely we implement the method [`replaceCart`](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L130):

```javascript
function replaceCart() {
   $scope.eventBus.publish( 'didReplace.' + features.cart.resource, {
         resource: features.cart.resource,
         data: resources.cart
      }, {
         deliverToSender: false
      }
   );
}
```

When the widget receives a `takeActionRequest` event for one of the actions configured through `features.article.onActions` it invokes the  [`addArticleToCart` method](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L37):

```javascript
$scope.features.article.onActions.forEach( function( action ) {
   $scope.eventBus.subscribe( 'takeActionRequest.' + action, addArticleToCart );
} );
```

The method [`addArticleToCart`](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L94) publishes a `willTakeAction` event,

```javascript
function addArticleToCart( event ) {
   $scope.eventBus.publish( 'willTakeAction.' + event.action, event );
```

adds the article to the cart and publishes an update for the shopping cart resource.

Finally, the widget publishes a [`didTakeAction`](../../includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget.js#L114) event to indicate that action processing has been completed.

```javascript
$scope.eventBus.publish( 'didTakeAction.' + event.action, event );
```

The [HTML template](../../includes/widgets/shop-demo/shopping-cart-widget/default.theme/shopping-cart-widget.html) does not have LaxarJS specific code beyond the fact that there are variables used which are defined in the [widget definition](../../includes/widgets/shop-demo/shopping-cart-widget/widget.json).


## Adding the Widget to our Application

We add the widget to the `content1c` section of our [first page](../../application/pages/shop_demo.json#L77), and configure only the required features.

```json
"content1c": [
   {
      "widget": "shop-demo/shopping-cart-widget",
      "features": {
         "cart": {
            "resource": "cart",
            "order": {
               "action": "order",
               "button": {
                  "htmlLabel": "<i class='fa fa-send'></i> Order"
               }
            }
         },
         "article": {
            "resource": "selectedArticle",
            "onActions": [ "addArticle" ]
         }
      }
   }
],
```


## The Next Step

The user can now select an article, have a look at its details and add it to the cart.
But when trying to order, nothing happens.
The ShoppingCartWidget triggers the action `order` but no other widget or activity reacts.
For this purpose, some [final steps](08_final_steps.md) are missing, namely implementing the OrderActivity and adding a confirmation page.

[« The ArticleTeaserWidget](06_article_teaser_widget.md)  | The ShoppingCartWidget | [Final steps »](08_final_steps.md)
