# Defining the Application Flow

After completing the initial two steps, we have a simple application with a first page, its layout and the first widget.
In this step we are going to make some modification in order to add _a second page_ and to make for a nicer _appearance_ of the application.
This allows us to get familiar with the declarative way that navigation is implemented in LaxarJS, and with the concept of _layouts._


## The Pages and the Flow

Under `application/pages` we rename `page1.json` to `shop_demo.json` and `page2.json` to `finish_order.json`.
The `shop_demo` page allows the user to search for and browse through articles and to submit an order.
The `finish_order` page will be shown after submitting an order to display a confirmation message.

These changes then need to be applied to the *application flow* which is defined at [`application/flow/flow.json`](../../application/flow/flow.json).
The flow defines the available navigation *places* (available as URLs) and the corresponding pages.
It also defines the *entry point* of the application which is the place initially displayed to the user.
The collaboration of the flow, places and pages is elucidated in the [flow manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/flow_and_places.md#flow-and-places).

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

Now we have a place for each of our two pages and an entry point which refers to the `shopDemo` place.


## Theme and Layout

At the moment our layout only has one column.
The final version of our [ShopDemo](http://laxarjs.github.io/shop_demo/#/shopDemo) has a header, three columns and a footer.
The header will contain a logo, a _SearchBoxWidget_ to filter articles, and the _HeadlineWidget_ we already created.
The main contents consist of an _ArticleBrowserWidget_ to view matching articles, an _ArticleTeaserWidget_ for details on a specific item and a _ShoppingCartWidget_ to keep track of what will be "bought".

We delete the template files from the folder `application/layouts` and create our own [application layout](../../application/layouts/application/default.theme/application.html) with associated [styles](https://github.com/LaxarJS/shop_demo/blob/feature/5-documentation-add-manual-references/application/layouts/application/default.theme/css/application.css).
Then, we change both of the pages to use the new layout:

```json
   "layout": "application"
```

For further information about layouts, refer to the [manual on pages and layouts](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/writing_pages.md#writing-pages).
To learn more about themes, have a look at the [creating themes manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes).

After restarting the development server, the application should look similar to this:

![screenshot after changing the layout](img/screenshot_step3.png)


## The Next Step

The next step is to create the [ArticleSearchBoxWidget](04_article_search_box_widget.md).

[« Hello, World!](02_hello_world.md) | Defining the Application Flow | [The ArticleSearchBoxWidget »](04_article_search_box_widget.md)
