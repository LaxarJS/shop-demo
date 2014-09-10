# Adapt the Base Files to the ShopDemo Application
At this moment, after concluding the initial two steps, we have a simple application with default files, layout and theme.
In this step we change them to achieve a consistent application and a nicer appearance of the pages.
It would go beyond the scope of this tutorial to explain the creation of a layout and theme.
We will therefore just obtain the layout and theme from the existing ShopDemo.

## Pages
We rename `application/pages/page1.json` to `application/pages/shop_demo.json` and `application/pages/page2.json` to `application/pages/finish_order.json`.

These changes then need to be applied to `application/flow/flow.json` as well.
This file defines the entry point and the places of the application.
Every place refers to a page.
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

## Layout
We delete the files in the folder **application/layouts** and fetch the files from the completed ShopDemo:
[Layout](https://github.com/LaxarJS/shop_demo/tree/master/application/layouts/)

Change the pages to use the new layout:

**application/pages/shop_demo.json**
```json
{
   "layout": "application",

   "areas": {
      "activities": [
      ],

      "content1a": [
         {
            "widget": "shop_demo/article_browser_widget",
            "features": {}
         }
      ]
   }
}
```

**application/pages/finish_order.json**
```json
{
   "layout": "application",

   "areas": {
   }
}
```

Stop the server (`Ctrl-C`) and restart it with `npm start`.

The [current app](http://localhost:8000/debug.html) should look similar to this:

![screenshot of current state](img/screenshot_step3.png)

## Next Step
The next step is to add functionality to the [ArticleBrowserWidget](article_browser_widget.md).  


[<< Hello World](hello_world.md) | ShopDemo | [ArticleBrowserWidget >>](article_browser_widget.md)  

