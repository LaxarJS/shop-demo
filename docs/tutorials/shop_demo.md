# Conform Base Files to the ShopDemo Application
At the moment we have a simple application with default files, layout and theme. In this step we change them to have a consistently application and a nicer appearance of the pages. To explain the creation of a layout and theme it goes beyond the scope of the tutorial. We will get the layout and theme from the finished ShopDemo.

## Pages
We rename application/pages/page1.json to application/pages/shop_demo.json and application/pages/page2.json to application/pages/finish_order.json. 

We have to change the application/flow/**flow.json**. In this file we define the entry point of the application and the places. Every place refers to a page. We write pages in a declarative fashion using the JSON format. Every page has a layout and areas with widgets and activities. 
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
We delete the files in the folder **application/layouts** and get the files from the completed ShopDemo:
[Layout](../application/layouts)

Change the pages to include the new layout:

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

Stop the server (Ctrl-C) and restart it with ```npm start```.

The [current app](http://localhost:8000/debug.html) should be similar to this:

![screenshot of current state](img/screenshot_step3.png)

## Next Step
The next step is to add functionality to the [ArticleBrowserWidget](article_browser_widget.md).  


[<< Hello World](hello_world.md) | ShopDemo | [ArticleBrowserWidget >>](article_browser_widget.md)  

