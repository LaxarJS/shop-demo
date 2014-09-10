# Hello World!
This step is about how to develop LaxarJS widgets and how to integrate them into our application.
We develop a first version of the ArticleBrowserWidget which only displays a headline.
In the step succeeding the next one we will extend this widget further.

## What is a Widget?
A LaxarJS application consists of pages which embed several small artifacts like widgets and activities.
Each widget is responsible for a part of the view and user interaction of an application, while communication with a backend server is often carried out by activities.
The difference between widgets and activities is that an activity doesn't render DOM elements or manipulate the DOM at all and could thus (at least theoretically) run on the server whereas a widget needs the environment provided by a browser.
As every widget and activity is an encapsulated artifact without any JavaScript api, communication with each other only takes place via the EventBus as we will see later in this tutorial.

## Develop a Simple LaxarJS Widget

### Base Structure
To accelerate the process of developing a widget we execute the script **laxar-widget**, which will generate a simple stub start from:
```shell
mkdir -p includes/widgets/shop_demo/article_browser_widget
cd includes/widgets/shop_demo/article_browser_widget
grunt-init laxar-widget
```
The script will ask some details about the widget and make suggestions.
We change the description and some of the other default answers such as the licenses.
This information is automatically stored in the files widget.json and bower.json.

```shell
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

The ArticleBrowserWidget exists as a set of files now.
The files that make up the actual implementation are named after the widget:

* default.theme/article_browser_widget.html
* default.theme/scss/article_browser_widget.scss
* default.theme/css/article_browser_widget.css
* spec/article_browser_widget_spec.js
* article_browser_widget.js

Additionally every widget has a file defining its configuration options and meta information about the widget:
* widget.json

All other files are rarely or never edited:
* .gitignore
* bower.json
* LICENSE-MIT or a other license
* spec/spec_runner.html
* spec/spec_runner.js

### Features
The configuration options defined in the widget.json file are called **features** and can be found under the same key in the JSON structure.
Everything that should later be configured when adding the widget to the page is specified here in [JSON schema draft v4](http://json-schema.org/documentation.html) format.
For now the ArticleBrowserWidget will only have the feature **display** with a single property **headline**.

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

In the widget.json we define the schema for the configuration of the widget when we add it to a page.
Each object which defines a parameter should have a description, can have a default value, can be required or optional and must have a type.
The widget configuration in a page is validated by a JSON validator built into LaxarJS.
A missing required property in the configuration of a page or a wrong value will result in an error message.
If the validation is successful, an object `features` in the `$scope` of the widget is created.
The object `features` contains the configuration given in the page or provided via the default values given in the widget.json file.


### HTML Template
Next we create the HTML template.
As the `features` object is available in the `$scope`, we can directly reference the property `$scope.features.headline` from the widget.json.

**shop_demo/includes/widgets/shop_demo/article_browser_widget/article_browser_widget.html:**
```html
<h3>
   {{ features.display.headline }}
</h3>
```

With these two steps we completed the first simple version of the ArticleBrowserWidget and we can add it to a page of the application.

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

In the page above we first chose a layout, in this case a very simple one with only one column for content.
Each `data-ax-widget-area` attribute value in the HTML template of the layout correlates to a key of the `areas` object in the JSON file of the page and resembles the name of the according area.
The values are arrays, that take up the widgets in the order they should appear in within the browser's DOM tree.
In our ShopDemo app we add the ArticleBrowserWidget to the area called `header`.

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
```shell
cd -
npm start
```

We should see a site with the headline **Hello World!**.

## Next Step
The next step is to adapt the base files to the [ShopDemo](shop_demo.md) application.

[<< Getting Started](getting_started.md) | Hello World! | [ShopDemo >>](shop_demo.md)  
