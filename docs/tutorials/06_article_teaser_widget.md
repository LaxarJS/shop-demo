# ArticleTeaserWidget
The ArticleTeaserWidget has two tasks:
Display the details of a selected article and let the user add this article to the shopping cart.
In the last chapter we implemented the ArticleBrowserWidget which publishes a selected article as a resource on the EventBus, which is exactly the information the ArticleTeaserWidget will use to carry out its tasks.
It then displays the details of the article published as selected and provides an *add to cart* button for it.
Whenever the user presses the button the widget publishes a `takeActionRequest` event for the upcoming ShoppingCartWidget to add the selected article to the cart or increase the amount if the article was already added.

![Step 6](img/step6.png)

The ArticleTeaserWidget gets the selected article from the ArticleBrowserWidget.

## Appearance of the ArticleTeaserWidget
This is what the final ArticleTeaserWidget will look like:

![ArticleTeaserWidget](img/article_teaser_widget.png)

The ArticleTeaserWidget has a headline, a table with the article details and the *add to cart* button.

## Display an Article
The first requirement is that it is possible to configure a resource resembling an article.
We assume that this resource will be published by another widget or activity on the EventBus and that it will have information about an article.
In our ShopDemo application it will be the article selected by the user.

The implementation of this feature doesn't differ much from the *display* feature of the ArticleBrowserWidget.
We add the feature `display` to the [widget definition](../../includes/widgets/shop_demo/article_teaser_widget/widget.json#L20) and define it as [required](../../includes/widgets/shop_demo/article_teaser_widget/widget.json#L17).
For this feature we already adjust the [template](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html) by adding the headline and a definition list for the article details.
Again we [use the resource handler](../../includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js#L24) defined in the LaxarJS Patterns library to listen for the relevant events of the resource.
For styling we generate the [CSS file](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/css/article_teaser_widget.css) from the [Sass file](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/scss/article_teaser_widget.scss).

## Add an Article to the Cart
The second requirement is that the user can add the displayed article to the shopping cart.
For this feature we add a button which triggers a `takeActionRequest` event on the EventBus to broadcast our intention.
As the implementation of the cart is not part of this widget, the actual addition of the article to the items in the cart is also out of scope.
The name of the action is configured in the [`button`](../../includes/widgets/shop_demo/article_teaser_widget/widget.json#L58) feature, where also the labeling of the button takes place.

To implement the feature *button* we add the [function `$scope.addToCart`](../../includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js#L26) in the controller, that is responsible for triggering the configured `takeActionRequest` event:
```javascript
$scope.addToCart = function() {
   var actionName = $scope.features.button.action;
   $scope.eventBus.publish( 'takeActionRequest.' + actionName, {
      action: actionName
   } );
};
```

We then add a simple button to the [HTML template](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html#L25), that triggers this function on click by using the according `ngClick` directive from AngularJS:
```html
<button class="btn btn-default btn-info pull-right"
        type="button"
        data-ng-class="{ 'ax-disabled': !resources.display.details.name }"
        data-ng-click="addToCart()"
        data-ng-bind-html="features.button.htmlLabel"></button>
```


## Adding the Widget to our Application
We add the widget to the `content1b` area of our [first page](../../application/pages/shop_demo.json#L63) and configure only the required features that have no sufficient default value defined in the `widget.json`:

```json
"content1b": [
   {
      "widget": "shop_demo/article_teaser_widget",
      "features": {
         "display": {
            "resource": "selectedArticle"
         },
         "button": {
            "htmlLabel": "<i class='fa fa-shopping-cart'></i> Add to Cart",
            "action": "addArticle"
         }
      }
   }
]
```

Stop the server and start it again with `npm start`.

## The Next Step
Our app has an *add to cart* button in the article details section now.
When pressing it nothing visible happens as the [ShoppingCartWidget](07_shopping_cart_widget.md) is still missing.
Let's implement that one next.


[« ArticleBrowserWidget](05_article_browser_widget.md) | ArticleTeaserWidget | [ShoppingCartWidget »](07_shopping_cart_widget.md)

