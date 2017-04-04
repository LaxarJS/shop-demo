# Defining the Application Flow

After completing the previous steps, we already have a real application with a first page, its layout and a first widget.
In this step we are going to make some modification in order to add _a second page_ and to navigate between those pages.
This allows us to get familiar with the declarative way that _flow navigation_ is implemented in LaxarJS.


## Pages and the Flow

Under `application/pages` we rename `home.json` to `browse.json` and create a second page, `confirmation.json` which we will complete below.
The `shop_demo` page will allow the user to search for articles, to add them to the shopping cart and to submit an order.
The `finish_order` page will be shown after submitting an order to display a confirmation message.

For this, we need to modify the *application flow* which is defined at [`application/flows/main.json`](../../application/flows/main.json).
The flow defines the navigation *places* with their URL routing patterns, and associates the corresponding pages.
It also defines *semantic pointers* between the places, called *targets*.
The collaboration of the flow, places and pages is explained in full detail in the [flow manual](https://laxarjs.org/docs/laxar-v2-latest/manuals/).

Here is a flow definition that includes a second place for the confirmation page:

```json
{
   "places": {

      "entry": {
         "patterns": [ "/" ],
         "redirectTo": "browse"
      },

      "browse": {
         "patterns": [ "/browse" ],
         "targets": {
            "next": "confirmation"
         },
         "page":  "home"
      },

      "confirmation": {
         "patterns": [ "/confirm" ],
         "page":  "confirmation"
      }

   }
}
```

This flow definition consists of three places.
First, there is the `entry` place that matches just `/` as a URL path, and simply redirects to the `browse` place.
The `browse` place uses the _home_ page that we have already completed (the `.json` is added automatically).

The third place (`confirmation`) uses the newly created confirmation page.
It is also configured as the `next` target from the `browse` place.

The names of the places have no special meaning, except being used to identify them when used in redirects or targets.
The targets can also be named freely, but it is recommended to use `"next"` and `"previous"` whenever they make sense.


## Adding a "Not Found" Page

Sometimes users may enter your application by following a bookmark or link that is no longer valid.
Of course, you should always try to have stable, permanent URLs, but even then users might make typing mistakes when entering an application URL.
For this, a good application should provide a suitable "404 Not Found" error page.

To add such a place to your LaxarJS flow, modify it as follows:

```js
{
   "redirectOn": {
      "unknownPlace": "error404"
   },
   "places": {

      // ... start, browse, confirmation ...

      "error404": {
         "patterns": [ "/not-found" ],
         "page": "404"
      }

   }
}
```

This will forward all invalid paths to the `"error404"` place, and the associated page, `404.json`.
Here is some example content for that page.

```json
{
   "layout": "one-column",

   "areas": {
      "content": [
         {
            "widget": "headline-widget",
            "features": {
               "headline": {
                  "htmlText": "404 - Page not Found"
               },
               "intro": {
                  "htmlText": "This page does not exist. Try going <a href='/' title='home'>home</a>."
               }
            }
         }
      ]
   }
}
```

Now, let us get back to the confirmation page.


## The Confirmation Page

For the confirmation page, we can re-use the _headline-widget_ created in the first step:

```json
{
   "layout": "one-column",

   "areas": {
      "content": [
         {
            "widget": "headline-widget",
            "features": {
               "headline": {
                  "htmlText": "Thank you!"
               }
            }
         }
      ]
   }
}
```

The [actual confirmation page](../../application/pages/confirmation.json) includes some additional markup for a friendlier appearance.


## Changing the Theme

*TODO: explain theme change. Possibly move this to an earlier step.*

Change the using theme in the file `application/application.js` from `default` to `cube`:

```js
theme: 'cube',
```

To learn more about themes, have a look at the [creating themes manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/creating_themes.md#creating-themes).

After restarting the development server, the application should look similar to this:

*TODO: screenshot with the new theme*


## The Next Step

The next step is to allow interactive filtering of the available articles, using the [article-search-box-widget](07_article_search_box_widget.md).

[« Hello, World!](02_hello_world.md) | Defining the Application Flow | [The article-search-box-widget »](07_article_search_box_widget.md)
