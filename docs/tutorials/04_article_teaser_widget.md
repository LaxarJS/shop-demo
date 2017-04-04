# The article-teaser-widget

The _article-teaser-widget_ that we will implement in this step is going to have two features:
It will display details on a given *article*, and it will allow the user to *confirm* adding that article to the shopping cart.
Having learned about the event bus and the *resource*-pattern already, this part of the tutorial will introduce the *action*-pattern and explain how widgets may respond to events asynchronously.

In the previous chapter we implemented the article-browser-widget which publishes its selected article as a resource on the event bus.
This is exactly the information that the article-teaser-widget will use.
Whenever the user presses the _"add to cart"_ button, the widget publishes a `takeActionRequest` event.
This event is processed by the shopping-cart-widget (described in the next chapter) to add the selected article to the cart.

*TODO: diagram with short explanation*


## Appearance of the article-teaser-widget

This is what the finished article-teaser-widget will look like:

![article-teaser-widget](img/article_teaser_widget.png)

The widget has a headline, a picture of the article, a table containing details and the *add to cart* button.


## Creating the Widget

As always, use the LaxarJS generator to create a widget skeleton:

```console
yo laxarjs2:widget article-teaser-widget
```

Again, pick `"vue"` when asked for the _integration technology_.


## Displaying an Article

First, it must be possible to configure a resource representing the *article* to showcase.
In our ShopDemo application it will contain the article currently selected by the user.

Here is the feature schema:

```json
"article": {
   "type": "object",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "format": "topic",
         "axRole": "inlet",
         "description": "resource representing an article to display"
      }
   }
}
```

The implementation of this feature is similar to the *articles* feature of the article-browser-widget:

```vue
<template>
<div>
   <h3><i class='fa fa-search'></i> Details</h3>
   <div>
      <h4>{{ article.name || 'No article selected' }}</h4>
      <div class="row">
         <div class="col col-md-12">
            <img v-if="article.pictureUrl" :src="article.pictureUrl" />
         </div>
      </div>
      <div class="row">
         <div class="col col-md-12">
            <dl class="dl-horizontal">
               <dt>Art. ID</dt><dd>{{ article.id }}</dd>
               <dt>Description</dt><dd v-html="article.htmlDescription"></dd>
               <dt>Price</dt><dd>{{ formatted( article.price ) }}</dd>
            </dl>
         </div>
      </div>
   </div>
</div>
</template>

<script>
export default {
   data: () => ({ article: { id: null } }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.article.resource}`, ({ data }) => {
         this.article = data || { id: null };
      } );
   },
   methods: {
      formatted( price ) {
         return price == null ? null : `€ ${price.toFixed( 2 )}`;
      }
   }
};
</script>
```

In this case, a _method_ is used to format the article price.
You might wonder if we should precompute the formatted value so that it is not recalculated each time the template is rendered.
But, since Vue.js will only run the method when the underlying data has changed, it does not cause any overhead.

Finally, the Vue.js directive `v-html` is used to render the article HTML description.
As discussed with the plain widget, you should only ever render HTML that you _trust,_ or your application will be susceptible to [Cross-Site-Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerabilities.


## Let the User Add an Article to the Cart

The second requirement is that the user can *confirm* adding the selected article to the shopping cart.

Here is the feature schema:

```json
"confirmation": {
   "type": "object",
   "required": [ "action" ],
   "properties": {
      "action": {
         "type": "string",
         "format": "topic",
         "axRole": "outlet",
         "description": "action to request adding the selected article to cart"
      }
   }
}
```

Now, you will need to add a button to the widget template, with an associated handler method that triggers a `takeActionRequest` event on the event bus to broadcast our intention.
Here are the necessary changes to the component:

```vue
<template>
<div>
   <!-- ... headline, details ... -->
   <div>
      <button type="button"
          class="btn pull-right"
          :class="{ 'btn-info': article.id, 'ax-disabled': !article.id }"
          @click="addToCart()"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
   </div>
</div>
</template>

<script>
export default {
   // ... data, created ...
   methods: {
      // ... formatted() ...
      addToCart() {
         const { action } = this.features.confirmation;
         this.eventBus.publish( `takeActionRequest.${action}`, { action } );
      }
   }
};
</script>
```

The new button triggers the `addToCart` method of the widget controller component.
This method simply publishes a `takeActionRequest` event using the configured action topic.
Like the resource pattern, the [action pattern](http://laxarjs.org/docs/laxar-patterns-v2-latest/patterns/actions/) is described in-depth in the [LaxarJS Patterns documentation](http://laxarjs.org/docs/laxar-patterns-v2-latest/).
Note that when compared to resource events, action events do not necessarily need a payload.
Often, they just _signal_ a user intent.


## Adding the New Widget to the Application

Before adding the article-teaser-widget to the `home.json`, let us switch to a _different layout._
The current one-column layout only allows you to display all widgets in a single column.
It seems that a _three-column_ layout would be more useful, where _article-browser-widget, article-teaser-widget_ and the (yet to be created) _shopping-cart-widget_ are shown side by side.
This allows you to make use of wider screens, and for mobile devices, the columns can still be stacked vertically.

To get started, create a new layout HTML file `three-columns/default.theme/three-columns.html` under `application/layouts`, side-by-side to the existing `"one-column"` layout.
Here is the required HTML:

```html
<div class="container">
   <div class="row">
      <div class="col col-md-4" data-ax-widget-area="contentA"></div>
      <div class="col col-md-4" data-ax-widget-area="contentB"></div>
      <div class="col col-md-4" data-ax-widget-area="contentC"></div>
   </div>
</div>
```

Using this layout provides you with three widget areas, arranged in a responsive fashion by Bootstrap CSS.
All that is left is to adjust the page definition accordingly, and to add configuration for the new widget:

```js
{
   "layout": "three-columns",

   "areas": {
      "activities": [ /* ... dummy-articles-activity ... */ ],
      "contentA": [ /* ... headline-widget, article-browser-widget ... */ ],
      "contentB": [
         {
            "widget": "article-teaser-widget",
            "features": {
               "article": {
                  "resource": "selectedArticle"
               },
               "confirmation": {
                  "action": "addToCart"
               }
            }
         }
      ],
      "contentC": []
   }
}
```

In the browser, you should now be able to select articles from the _article-browser-widget_, with the _article-teaser-widget_ updating accordingly.


## The Next Step

Our app shows details on the selected article now.
When pressing the *add to cart* button however, there is no visible reaction since the [shopping-cart-widget](05_shopping_cart_widget.md) is still missing.
Let us implement that widget next.

[« The article-browser-widget](03_article_browser_widget.md) | The article-teaser-widget | [The shopping-cart-widget »](05_shopping_cart_widget.md)
