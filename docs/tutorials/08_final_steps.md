# Final Steps

All that is left to do now is writing the order confirmation page for our application.
In this final part of the tutorial, you will also learn how to create an optimized version of your application for production.


## Adding Another Page

The shopping-cart-widget from our previous step publishes a _navigateRequest_ for the configured target _finishOrder_.
How is this target resolved to a JSON page definition?
At this point, we go back to the [flow definition](../../application/flow/flow.json#L11-13), that was introduced in [step 3](03_application_flow.md):

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

The flow definition allows to configure _global places_ as we have done here, which either point directly to a page or which redirect to another place.
It is also possible to define _targets_ from each place to other places, establishing flow relations such as _next_ and _previous_.

The [second page *finish_order.json*](../../application/pages/finish_order.json) uses and configures only the headline-widget, which we [introduced previously](02_hello_world.md).

Now we start the server with `npm start` again and visit the application.
By "placing" an order we can now navigate to the confirmation page.


## Theming Widgets and Layouts

The CSS files that we have written for our widgets and layouts only cover the basics that are necessary for displaying our application.
For a more sophisticated styling, we add a _theme_ based on [Bootstrap CSS](http://getbootstrap.com) under `includes/themes/cube.theme`.
The LaxarJS documentation contains a [manual on themes](//github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes) related to this shop demo, which goes into more detail.


## Deploying the Application

The application is now complete and we can prepare an _optimized version_ ready for deployment:

```shell
npm run-script optimize
```

Start the server with `npm start` and visit the [production version](http://localhost:8000/index.html).

In contrast to the `debug.html`, the optimized `index.html` version does not pick up changes automatically.
However, the number and transfer size of HTTP requests is greatly reduced when using the optimized version, making for a much better user experience.
For this reason, it is strongly recommended to always use this version for production.

Of course, when creating you own application, you do not have to use the HTML files provided by the LaxarJS scaffolding _as-is_.
Instead, you should be able to include the relevant sections from the `index.html` file into any server side templating system:
The stylesheet reference and the `body` contents are required, and do not forget to adjust the paths to your setup.


## The Next Step

Go ahead and develop your own application!
Check out the [LaxarJS manuals](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/index.md#manuals) for more information, and get familiar with the [LaxarJS Patterns](https://github.com/LaxarJS/laxar-patterns/blob/master/docs/index.md#laxarjs-patterns) to learn how to create the best and most reusable widgets.

[« The shopping-cart-widget](07_shopping_cart_widget.md)  | Final steps
