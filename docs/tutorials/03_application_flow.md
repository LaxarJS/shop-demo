# Defining the Application Flow

After completing the initial two steps, we have a simple application with a first page, its layout and the first widget.
In this step we are going to make some modification in order to add _a second page_ and to make for a nicer _appearance_ of the application.
This allows us to get familiar with the declarative way that navigation is implemented in LaxarJS, and with the concept of _layouts._


## Pages and the Flow

Under `application/pages` we rename `home.json` to `shop_demo.json` and copy it to a second page, `finish_order.json` which we will come back to later.
The `shop_demo` page will allow the user to search for articles, to add them to the shopping cart and to submit an order.
The `finish_order` page will be shown after submitting an order to display a confirmation message.

For this, we need to modify the *application flow* which is defined at [`application/flow/flow.json`](../../application/flow/flow.json).
The flow defines the available navigation *places* (available as URLs) and the corresponding pages.
It also defines the *entry point* of the application which is the place initially displayed to the user.
The collaboration of the flow, places and pages is explained in detail in the [flow manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/flow_and_places.md#flow-and-places).

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

Now we have a place for each of our two pages and an entry place, used whenever no place was specified in the URL, which redirects to the `shopDemo` place.


## Theme and Layout

At the moment our layout only has one column.
The final version of our [ShopDemo](http://laxarjs.github.io/shop-demo/#/shopDemo) has a header, three columns and a footer.
The header will contain a logo, an _article-search-box-widget_ to filter articles, and the _headline-widget_ we already created.
The main contents consist of an _article-browser-widget_ to view matching articles, an _article-teaser-widget_ for details on a specific item and a _shopping-cart-widget_ to keep track of what will be "bought".

We delete the directory `application/layouts/one-column` with the template files and create our own [application layout](../../application/layouts/application/default.theme/application.html) with associated [styles](https://github.com/LaxarJS/shop-demo/blob/master/application/layouts/application/default.theme/css/application.css).

Then, we change both of the pages to use the new layout:

```json
   "layout": "application"
```

We add the *cube* theme to our application:

```shell
git clone https://github.com/LaxarJS/cube.theme.git includes/themes/cube.theme
```

Change the using theme in the file `application/application.js` from `default` to `cube`:

```javascript
theme: 'cube',
```


For further information about layouts, refer to the [manual on pages and layouts](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/writing_pages.md#writing-pages).
To learn more about themes, have a look at the [creating themes manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes).

After restarting the development server, the application should look similar to this:

![screenshot after changing the layout](img/screenshot_step3.png)


## The Next Step

The next step is to fetch and filter the articles that we are going to offer for sale, using the *dummy-articles-activity* and the [article-search-box-widget](04_article_search_box_widget.md).

[« Hello, World!](02_hello_world.md) | Defining the Application Flow | [The article-search-box-widget »](04_article_search_box_widget.md)
