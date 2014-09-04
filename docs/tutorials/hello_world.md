# Hello World!
This step is about the LaxarJS widgets and how we can use them in our application. We develop a first version of the ArticleBrowserWidget which only displays a headline. In the step after the next one we will extend the widget.

## What is a Widget?
A LaxarJS application consists of pages which embed several small artifacts like widgets and activities.
A widget is a small artifact which is responsible for a part of the view and user interaction of an application. The communication with the server is often done by the activities. The difference between the widgets and the activities is that an activity doesn't include DOM elements. An activity could run on the server whereas a widget needs the client. Every widget and activity is an encapsulated artifact. They communicate with each other via the EventBus.  

## Develop a Simple LaxarJS Widget

### Base Structure
To accelerate the process of developing a widget we execute the script **laxar-widget**:
```
mkdir -p includes/widgets/shop_demo/article_browser_widget
cd includes/widgets/shop_demo/article_browser_widget
grunt-init laxar-widget
```
The script will ask some details about the widget and make suggestions. We change the description and some of the other default answers such as the licenses. This information is automatically stored in the files widget.json and bower.json.

```
Please answer the following:
[?] Widget namespace (widgets.shop_demo) 
[?] Widget name (article_browser_widget) 
[?] Widget title (ArticleBrowserWidget) 
[?] Description (My new LaxarJS widget) The ArticleBrowserWidget displays a list of articles and lets the user select one.
[?] Licenses (none) MIT
[?] Project homepage (none) www.laxarjs.org
[?] Author name (author) LaxarJS
[?] Version (0.1.0) 
[?] LaxarJS version (0.x) 
[?] Integration type (angular) 
[?] Do you need to make any changes to the above before continuing? (y/N) 
```

The ArticleBrowserWidget exists for a bunch of files now. The important files for the basic development are named after the widget name:

* default.theme/article_browser_widget.html
* default.theme/scss/article_browser_widget.scss
* default.theme/css/article_browser_widget.css
* spec/article_browser_widget_spec.js
* spec/article_browser_widget_spec.js
* article_browser_widget.js

As an exception every widget has the file:
* widget.json

The other files rarely or never edited:
* .gitignore
* bower.json
* LICENSE-MIT or a other license
* spec/spec_runner.html
* spec/spec_runner.js

### Features
For every widget we define his api in the widget.json. Therefore it has an object named **features** with attributes to configure its appearance and its functionality when we add it to an application page. At first, the ArticleBrowserWidget will only have the feature **display** with one property **headline**.

**shop_demo/includes/widgets/shop_demo/article_browser_widget/widget.json:**
```json
{
   "name": "ArticleBrowserWidget",
   "description": "The ArticleBrowserWidget displays a list of articles and lets the user select one.",
   "version": {
      "spec": "0.1.0"
   },

   "integration": {
      "type": "angular"
   },

   "compatibility": [ "json-patch" ],

   "features": {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "type": "object",      
      "properties": {

         "display": {
            "type": "object",
            "description": "Display a list with articles.",
            "required": [ "resource" ],
            "properties": {
               "headline": {
                  "type": "string",
                  "default": "Articles",
                  "description": "The title for the widget."
               }
            }
         }
      }
   }
}
```

In the widget.json we define the schema for the configuration of the widget when we embed it to a page. Each object which defines a parameter should have a description, can have a default value, can be required or optional and must have a type. The widget configuration in a page is validated by the LaxarJS JSON validator. A missing required property in the configuration of a page or a wrong value will result in an error message.  If the validation is successful, an object ```features``` in the ```$scope``` of the widget is created. The object ```features``` contains all configured and defined objects regulated by their attributes. 


### HTML Template
Next we create the HTML template. We can use the ```$scope.features.headline``` object from the widget.json.

**shop_demo/includes/widgets/shop_demo/article_browser_widget/article_browser_widget.html:**
```html
<h3>
   {{ features.display.headline }}
</h3>
```


With these two steps we completed the first simple version of the ArticleBrowserWidget and we can embed it to a page of the application.

**shop_demo/application/pages/page1.json:**
```json
{
   "layout": "one_column",

   "areas": {
      "activities": [
      ],

      "header": [
         {
            "widget": "shop_demo/article_browser_widget",
            "features": {
               "display": {
                  "headline": "Hello World!"
               }
            }
         }
      ],

      "content": [

      ],

      "footer": [
      ]
   }
}
```

In a page we first define the layout. The default layout with one column is a simple one. For each ```data-ax-widget-area``` property in the HTML template of the layout we have a section in the JSON file of a page. In our ShopDemo app we use the section ```header``` for the ArticleBrowserWidget.

**shop_demo/application/layouts/one_column/default.theme/one_column.html:**
```html
<div class="one-column-layout container">

   <div style="display: none" data-ax-widget-area="activities"></div>

   <header class="ax-header" data-ax-widget-area="header">
   </header><!-- /header -->

   <div class="ax-content" data-ax-widget-area="content">
   </div><!-- /content -->

   <footer class="ax-footer" data-ax-widget-area="footer">
   </footer><!-- /footer -->
</div>
```

Now we start the application again and visit it at [http://localhost:8000/debug.html](http://localhost:8000/debug.html):
```
cd -
npm start
```

We should see a site with the headline **Hello World!**.

## Next Step
The next step is to conform the base files to the [ShopDemo](shop_demo.md) application.  

[<< Getting Started](getting_started.md) | Hello World! | [ShopDemo >>](shop_demo.md)  
