# The article-teaser-widget

The _article-teaser-widget_ that we will implement in this step is going to have two features:
It will display details on a given *article*, and it will allow the user to *confirm* adding that article to the shopping cart.
Having learned about the event bus and the *resource*-pattern already, this part of the tutorial will introduce the *action*-pattern and explain how widgets may respond to events asynchronously.

In the previous chapter we implemented the article-browser-widget which publishes its selected article as a resource on the event bus.
This is exactly the information that the article-teaser-widget will use.
Whenever the user presses the _"add to cart"_ button, the widget publishes a `takeActionRequest` event for the shopping-cart-widget (described in the next chapter) to add the selected article to the cart or to increase the amount if the article was already added.

![Step 6](img/step6.png)

As shown on the diagram, the article-teaser-widget will get the selected article from the article-browser-widget.


## Appearance of the article-teaser-widget

This is what the finished article-teaser-widget will look like:

![article-teaser-widget](img/article_teaser_widget.png)

The widget has a headline, a picture of the article, a table containing details and the *add to cart* button.



## Using a Custom Integration Technology

This widget showcases an advances use case, as it is implemented using [React](https://facebook.github.io/react/) via the [laxar-react-adapter](https://github.com/LaxarJS/laxar-react-adapter).
When looking at the [widget controller](../../includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget.jsx#L11-86), you can see that it is implemented as an EcmaScript 6 module, using JSX inline to generate HTML rather than an external template file.

To recompile the `.jsx` controller to a version that can be accessed by LaxarJS running in your browser, make sure to recompile it using `babel -m amd`.
In order to actually instantiate the React-based widget, we need to install the `laxar-react-adapter` into our application.
The [installation documentation](https://github.com/LaxarJS/laxar-react-adapter#installation) of the laxar-react-adapter should contain all information that you will need for this.
To recompile the `.jsx` file, you will also need to `npm install -g babel` if you have not already. 

There also is a [previous version](https://github.com/LaxarJS/shop-demo/blob/v1.9.0/includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget.js) of the widget which is implemented in AngularJS with an [external HTML template](https://github.com/LaxarJS/shop-demo/blob/v1.9.0/includes/widgets/shop-demo/article-teaser-widget/default.theme/article-teaser-widget.html).
If your not interested in learning how to create a React-based widget right now, you can simply have a look at that previous version.
All relevant concepts have already been introduced in the previous chapters.

The following explanation is based on the more recent React-based version.


## Displaying an Article

First, it must be possible to configure a resource representing the *article* to showcase.
In our ShopDemo application it will contain the article currently selected by the user.

The [implementation](https://github.com/LaxarJS/shop-demo/blob/master/includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget.jsx#L17-21) of this feature does not differ much from the *articles* feature of the article-browser-widget:

```jsx
const articleResource = features.article.resource;
eventBus.subscribe( 'didReplace.' + articleResource, event => {
   resources.article = event.data;
   render();
} );
```

Note that the form of the React-module is slightly different to that of the AngularJS module.
Instead of the `$scope`-injection that you get with AngularJS widgets, you are provided with an `axReactRender` injection, which is a function.
This rendering function is used to create and refresh the HTML-representation of the widget, since in contrast to AngularJS, React does not automatically try to do this.
The HTML template itself lives right here in the JavaScript file, as is customary for React applications. 

For everything to work, we add the required configuration for the feature `article` to the [widget descriptor](../../includes/widgets/shop-demo/article-teaser-widget/widget.json#L16-26), and again add some [styling](../../includes/widgets/shop-demo/article-teaser-widget/default.theme/css/article-teaser-widget.css).


## Let the User Add an Article to the Cart

The second requirement is that the user can *confirm* adding the selected article to the shopping cart.
For this we add a button that triggers a `takeActionRequest` event on the event bus to broadcast our intention.
Like the resource pattern, the [action pattern](https://github.com/LaxarJS/laxar-patterns/blob/master/docs/patterns/actions.md#action-patterns) is also described in the [LaxarJS Patterns documentation](https://github.com/LaxarJS/laxar-patterns/blob/master/docs/index.md#laxarjs-patterns).
The name of the action is configured under the [*confirmation*](../../includes/widgets/shop-demo/article-teaser-widget/widget.json#L28-38) feature.

To implement the feature *button* we implement the event handler [`addToCart`](../../includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget.jsx#L23-L28) to the controller which causes a request for the configured action to be published:

```javascript
function addToCart() {
   const actionName = features.confirmation.action;
   eventBus.publish( 'takeActionRequest.' + actionName, {
      action: actionName
   } );
}
```

A simple button in the [generated HTML](../../includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget.jsx#L31-L39) triggers this method on click:

```jsx
<button type='button'
        className={ `btn pull-right ${resources.article ? 'btn-info' : 'ax-disabled'}` }
        onClick={addToCart}><i className='fa fa-shopping-cart'></i> Add to Cart</button>
```


## Adding the Widget to our Application

We add the widget to the area `contentB` of our [first page](../../application/pages/shop_demo.json#L43-55) and configure only the required features:

```json
"contentB": [
   {
      "widget": "shop-demo/article-teaser-widget",
      "features": {
         "article": {
            "resource": "selectedArticle"
         },
         "confirmation": {
            "action": "addArticle"
         }
      }
   }
]
```

As always after adding a new widget, we will need to restart the development server at this point.


## The Next Step

Our app shows details on the selected article now.
When pressing the *add to cart* button however, there is no visible reaction since the [shopping-cart-widget](07_shopping_cart_widget.md) is still missing.
Let us implement that widget next.

[« The article-browser-widget](05_article_browser_widget.md) | The article-teaser-widget | [The shopping-cart-widget »](07_shopping_cart_widget.md)
