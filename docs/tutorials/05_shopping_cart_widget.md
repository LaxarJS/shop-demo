# The shopping-cart-widget

The next step for our ShopDemo application is to implement the _shopping-cart-widget_.
It will display the current shopping cart contents with all articles added by the user and allows the user change the order quantity for each article.
You will also learn how widgets can use events to trigger flow-based navigation.

*TODO: event wiring diagram*

The _shopping-cart-widget_ subscribes to the currently selected article (`didReplace` event), as well as to the user intent to add the article to the cart (`takeActionRequest` event).
It also allows to increase or decrease the quantity of each shopping cart item.


## Appearance of the shopping-cart-widget

This is what the finished shopping-cart-widget will look like:

![shopping-cart-widget](img/shopping_cart_widget.png)

The shopping-cart-widget displays a headline, a table of current contents and buttons to modify the quantity of each article as well as a button that allows to complete the process.


## Features of the shopping-cart-widget

The widget needs to do two things:

* It has to subscribe to changes of the selected *article* resource and to the action that expresses the user intent to add that article to the cart.
  The user should also be able to change the quantity of individual articles, possibly causing positions to be removed from the shopping cart completely.

* To simulate the actual shopping process, the widget should also offer an *order* button.
  In a real shop, this would start the (server-side) checkout/payment process.
  For the purpose of this demo, let us be content with simply navigating to a confirmation page.


### Displaying the Shopping Cart Articles

The widget needs to know _what article_ might be added to the cart, for which it allows configuration of an *article* resource.
It also needs to know _when_ the current article was added, so it also allows to configure the actions that should trigger adding the article to the cart.

```json
"article": {
   "type": "object",
   "required": [ "resource", "onActions" ],
   "properties": {
      "resource": {
         "type": "string",
         "format": "topic",
         "axRole": "inlet",
         "description": "ID of the article resource to add to the cart."
      },
      "onActions": {
         "type": "array",
         "description": "Adds the article to the cart.",
         "items": {
            "type": "string",
            "format": "topic",
            "axRole": "inlet"
         }
      }
   }
}
```

Note that the widget assumes the role of an _inlet_ (subscriber) with respect to both resource and actions.
This is the glue that allows us to combine the article *selection resource* published by the _article-browser-widget_ with the *confirmation action request* published by the _article-teaser-widget._
By convention, multiple actions may be configured for widgets that *handle* action requests (those marked as _inlet_) so that it is simple to form many-to-one relations.

Below is the Vue.js component definition for an initial widget implementing the article feature.
Because the component is a bit more complex this time, let us look at just the `template` first:

```vue
<template>
<div>
   <h3><i class="fa fa-shopping-cart"></i> Shopping Cart</h3>
   <table class="table table-striped">
      <thead>
         <tr v-if="isEmpty">
            <th class="app-no-articles" colspan="5">
               Please select articles to add them to the cart!
            </th>
         </tr>
         <tr v-else>
            <th>Art. ID</th>
            <th>Article</th>
            <th class="text-right">Price</th>
            <th class="text-right" colspan="2">Quantity</th>
         </tr>
      </thead>
      <tbody>
         <tr v-for="item in cart">
            <td>{{ item.article.id }}</td>
            <td>{{ item.article.name }}</td>
            <td class="text-right">{{ format( item.article.price ) }}</td>
            <td class="text-right">{{ item.quantity }}</td>
            <td>
               <button type="button" class="btn btn-link"
                  @click="increment( item.article )"
                  ><i class="fa fa-plus-square"></i></button>
               <button type="button" class="btn btn-link"
                  @click="decrement( item.article )"
                  ><i class="fa fa-minus-square"></i></button>
            </td>
         </tr>
      </tbody>
      <tfoot>
         <tr>
            <td></td>
            <td>Subtotal</td>
            <td class="text-right">{{ format( sum ) }}</td>
            <td colspan="2"></td>
         </tr>
      </tfoot>
   </table>
</div>
</template>
```

This template mainly reuses _Vue.js_ concepts that were already shown in the previous steps.
Again, the [final template](../../application/widgets/shopping-cart-widget/shopping-cart-widget.vue) used in the [online shop demo](https://laxarjs.github.io/shop-demo/) uses several additional CSS classes, but they are not important for the lessons of this tutorial.
The directive `v-for` to iterate over the shopping cart contents, and interpolation expressions to display the actual data.
The only new directive is `v-else` which, used alongside `v-if`, allows to branch in a template.
Finally, there are _event bindings_ for the _increment_ and _decrement_ buttons, invoking the respective methods of the component controller object, which is shown below:

```vue
<script>
export default {
   data: () => ({ cart: [], article: { id: null } }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.article.resource}`, event => {
         this.article = event.data || { id: null };
      } );
      this.features.article.onActions.forEach( action => {
         this.eventBus.subscribe( `takeActionRequest.${action}`, () => {
            this.eventBus.publish( `willTakeAction.${action}`, { action } );
            if( this.article.id ) {
               this.increment( this.article );
            }
            this.eventBus.publish( `didTakeAction.${action}`, { action } );
         } );
      } );
   },
   computed: {
      isEmpty() {
         return !this.cart.length;
      },
      sum() {
         return this.cart.reduce(
            (sum, { article, quantity }) => sum + (article.price * quantity),
            0
         );
      }
   },
   methods: {
      format( price ) {
         return price == null ? '' : `€ ${price.toFixed( 2 )}`;
      },
      increment( article ) {
         const isInCart = this.cart.some( item => item.article.id === article.id );
         this.cart = isInCart ?
            this.cart.map( adjuster( article, 1 ) ) :
            [ ...this.cart, { article, quantity: 1 } ];
      },
      decrement( article ) {
         this.cart = this.cart
            .map( adjuster( article, -1 ) )
            .filter( ({ quantity }) => quantity > 0 );
      }
   }
};

function adjuster( articleToMatch, increment ) {
   return ({ article, quantity }) => ({
      article,
      quantity: article.id === articleToMatch.id ? quantity + increment : quantity
   });
}
</script>
```

The controller object of the _shopping-cart-widget_ component manages two data properties:

  - the currently selected article, to correctly handle the `addToCart` action,

  - the contents of the shopping cart, as items with `quantity` and `article`.

The `created` hook sets up subscriptions to the resource containing the currently selected article, and to the action for adding the article to the cart.
Action handling is implemented using a _will/did_ pattern:

First, the widget subscribes to _takeActionRequest_ events for each configured action topic.
When receiving a request to take action, the widget first acknowledges the request by publishing a _willTakeAction_ event.
This signals that an action has begun and that a response will eventually follow, which can happen _asynchronously_, allowing us to e.g. complete a call some REST API first.
However, in this case the widget is done right away after adding the article to its cart model, so that the _didTakeAction_ event is published right away.

Using this [will/did-pattern for actions](http://laxarjs.org/docs/laxar-patterns-v2-latest/patterns/actions/), it is even possible to track _any_ action in progress, by subscribing just to `takeActionRequest` without specifying an action name.
This may be done by the requesting widget or by completely different widget that has been configured to "listen in", for example to show a global progress indicator.
Then, there are handler methods for incrementing/decrementing the number of articles.
These simply update the cart model with the new article quantities, adding or removing items as needed.

Note that unlike the previous examples, this widget also uses _Vue.js computed properties_ (`sum`, `isEmpty`) for derived values, which Vue.js will re-evaluate as the underlying data changes, and which are accessed just like regular data properties from the template.


### Navigating to the Order Confirmation

Now that we can manage our shopping cart contents, we would like to be able to move on to another page for order confirmation.

In order to trigger navigation to a another page, your widget should allow to configure an _order_ feature with a _target_ string:

```json
"order": {
   "type": "object",
   "required": [ "target" ],
   "properties": {
      "target": {
         "type": "string",
         "description": "to be used in the navigateRequest for placing an order"
      }
   }
}
```

The component needs to be extended as follows, adding a button and a corresponding handler method:

```vue
<template>
<div>
   <!-- ... h3, table ... -->
   <div v-if="isEmpty">
      <button type="button" class="btn btn-success pull-right"
         @click="placeOrder()">
         <i class="fa fa-paper-plane"></i> Order
      </button>
   </div>
</div>
</template>

<script>
export default {
   // ... data(), created(), computed() ...
   methods: {
      // ... format(), increment(), decrement() ...
      placeOrder() {
         const { target } = this.features.order;
         this.eventBus.publish( `navigateRequest.${target}`, { target } );
      }
   }
};
// ...
</script>
```

The `placeOrder` event handler publishes a new type of event called `navigateRequest`.
This event instructs the LaxarJS runtime to change to the URL associated with the given _target_, usually causing the current page to be replaced.
Right now, we only have a single page in our application, so this will not do much.
The [next step](06_application_flow.md) of the tutorial gives instructions on adding another page and configuring the application flow.


### Styling the Widget

As before, you may want to create an SCSS stylesheet to improve the appearance of the widget, while adding the appropriate CSS classes in the template.

  - [full widget descriptor](../../application/widgets/shopping-cart-widget/widget.json), including `styleSource` attribute for SCSS support
  - [full .vue-component](../../application/widgets/shopping-cart-widget/shopping-cart-widget.vue), with additional classes inserted
  - [full SCSS stylesheet](../../application/widgets/shopping-cart-widget/default.theme/scss/shopping-cart-widget.scss)

Now, all that is left is adding the widget to your page definition.


## Adding the Widget to our Application

Let us now add the widget to the area `contentC` of the [home page](../../application/pages/home.json), connecting it to both _article-browser-widget_ and _article-teaser-widget_, and configuring a target:

```json
"contentC": [
   {
      "widget": "shopping-cart-widget",
      "features": {
         "article": {
            "resource": "selectedArticle",
            "onActions": [ "addArticle" ]
         },
         "order": {
            "target": "next"
         }
      }
   }
]
```


## The Next Step

The user can now select an article, have a look at its details and add it to the cart.
But when trying to order, nothing happens because the second page is still missing!
Let us create that page in the [next step](06_application_flow.md).

[« The article-teaser-widget](04_article_teaser_widget.md)  | The shopping-cart-widget | [Defining the Application Flow »](06_application_flow.md)
