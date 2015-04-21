# The ArticleTeaserWidget

The _ArticleTeaserWidget_ that we will implement in this step needs two features:
It displays details on a given article, and it also allows the user to add this article to the shopping cart.
Having learned about the event bus and the resource-pattern, this part of the tutorial will introduce the _actions_-pattern and explain how widgets may respond to events asynchronously.

In the previous chapter we implemented the ArticleBrowserWidget which publishes its selected article as a resource on the EventBus.
This is exactly the information that the ArticleTeaserWidget will use to carry out its tasks.
Whenever the user presses the _"add to cart"_ button, the widget publishes a `takeActionRequest` event for the ShoppingCartWidget (described in the next chapter) to add the selected article to the cart or to increase the amount if the article was already added.

![Step 6](img/step6.png)

The ArticleTeaserWidget gets the selected article from the ArticleBrowserWidget.


## Appearance of the ArticleTeaserWidget

This is what the final ArticleTeaserWidget will look like:

![ArticleTeaserWidget](img/article_teaser_widget.png)

The ArticleTeaserWidget has a headline, a table with the article details and the *add to cart* button.


## Displaying an Article

The first requirement is that it must be possible to configure a resource representing an article.
We assume that this resource will be published by another widget or activity on the EventBus and that it will contain information about an article.
In our ShopDemo application it will be the article selected by the user.

The implementation of this feature doesn't differ much from the *display* feature of the ArticleBrowserWidget.
We add a required feature `display` to the [widget definition](../../includes/widgets/shop_demo/article-teaser-widget/widget.json#L20), adjust the [template](../../includes/widgets/shop_demo/article-teaser-widget/default.theme/article-teaser-widget.html) by adding the headline and a list for the article details, and add some [styling](../../includes/widgets/shop_demo/article-teaser-widget/default.theme/css/article-teaser-widget.css).
Again we [use the resource handler](../../includes/widgets/shop_demo/article-teaser-widget/article-teaser-widget.js#L19) defined in the LaxarJS Patterns library to listen for the relevant events of the resource.


## Let the User Add an Article to the Cart

The second requirement is that the user can add the displayed article to the shopping cart.
For this feature we add a button which triggers a `takeActionRequest` event on the EventBus to broadcast our intention.
Like the resource pattern, the [action pattern](https://github.com/LaxarJS/laxar_patterns/blob/master/docs/patterns/actions.md#action-patterns) is also described in the [LaxarJS Patterns documentation](https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md#laxarjs-patterns).
As the implementation of the cart is not part of this widget, the actual adding of the article to the items in the cart is also out of scope.
The name of the action is configured in the [`button`](../../includes/widgets/shop_demo/article-teaser-widget/widget.json#L58) feature along with the label of the button.

To implement the feature *button* we add the method [`$scope.addToCart`](../../includes/widgets/shop_demo/article-teaser-widget/article-teaser-widget.js#L21) to the controller which causes a request for the configured action to be published:

```javascript
$scope.addToCart = function() {
   var actionName = $scope.features.button.action;
   $scope.eventBus.publish( 'takeActionRequest.' + actionName, {
      action: actionName
   } );
};
```

A simple button in the [HTML template](../../includes/widgets/shop_demo/article-teaser-widget/default.theme/article-teaser-widget.html#L25), triggers this method on click by using the `ngClick` directive from AngularJS:

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
      "widget": "shop_demo/article-teaser-widget",
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

As always when adding a new widget, we will need to restart the development server at this point.


## The Next Step

Our app has an *add to cart* button in the article details section now.
When pressing it, there is no visible result since the [ShoppingCartWidget](07_shopping_cart_widget.md) is still missing.
Let us implement that widget next.

[« The ArticleBrowserWidget](05_article_browser_widget.md) | The ArticleTeaserWidget | [The ShoppingCartWidget »](07_shopping_cart_widget.md)
