# Hello World!
This step is about developing our first LaxarJS widget and integrating it into our application.
We are going to create a simple HeadlineWidget which displays a headline and an optional introduction text.

## What is a Widget?
A LaxarJS application consists of pages which embed several small artifacts such as widgets and activities.
Each widget is responsible for a part of the screen and allows the user to perform specific tasks within the application, while communication with a backend server is often carried out by activities.
The technical difference between widgets and activities is that an activity doesn't render HTML or manipulate the DOM at all and could thus (at least theoretically) run on the server, whereas a widget requires the environment provided by a browser.
As every widget and activity is an encapsulated artifact without any JavaScript API, communication among widgets takes place via the EventBus only as we will see later in this tutorial.
For further information about widgets, activities and event communication there is a [additional document](../missing_doc.md).

## Developing a Simple LaxarJS Widget
The LaxarJS team develops test driven.
The widgets of the final ShopDemo have spec tests.
In this tutorial we skip the part about tests to set the focus on the base structure of a LaxarJS application.

### The Base Structure for Widgets
To accelerate the process of developing a widget we instantiate the template *laxar-widget*, to generate a basic stub start from:
```shell
mkdir -p includes/widgets/shop_demo/headline_widget
cd includes/widgets/shop_demo/headline_widget
grunt-init laxar-widget
```

The script `grunt-init` will ask for some details about the widget and make suggestions.
We change the description and some of the other default answers such as that on licenses.
This information is automatically stored in the files `widget.json` and `bower.json` of the widget.

```shell
Please answer the following:
[?] Widget namespace (widgets.shop_demo)
[?] Widget name (headline_widget)
[?] Widget title (HeadlineWidget)
[?] Description (My new LaxarJS widget) Displays a simple headline and an intro html text.
[?] Licenses (none) MIT
[?] Project homepage (none) www.laxarjs.org
[?] Author name (author) LaxarJS
[?] Version (0.1.0)
[?] LaxarJS version (0.x)
[?] Integration type (angular)
[?] Do you need to make any changes to the above before continuing? (y/N)
```

The HeadlineWidget exists as a set of files now:

Every widget has a file defining its configuration options and other meta information:

* widget.json

Then there are some infrastructure files, which are rarely or never edited:

* Dependencies of the widget for bower:
   * bower.json
* Files for the spec test runner:
   * spec/spec_runner.js
   * spec/spec_runner.html
* LICENSE-MIT or another license

The files that make up the *actual implementation* are named after the widget, in our case the HeadlineWidget:

* The widget controller and any AngularJS directives belonging to the widget:
   * headline_widget.js
* The HTML template defining the view of the widget. Multiple themes may be defined for a widget, resulting in multiple directories (not part of this tutorial) but there is always a default theme:
   * default.theme/headline_widget.html
* Files for styling the view. The `.scss` file is only relevant if using [Sass](http://sass-lang.com/) to generate CSS, otherwise the `.css` file may be edited manually:
   * default.theme/css/headline_widget.css
   * default.theme/scss/headline_widget.scss

Finally there is a jasmine spec test for testing the functionality of the widget:

   * spec/headline_widget_spec.js



### Widget Features
The configuration options defined in the [widget.json](../../includes/widgets/shop_demo/headline_widget/widget.json) file are called *features* and can be found under the same key in the JSON structure.
Everything that can later be configured when adding the widget to the page is specified here in [JSON schema draft v4](http://json-schema.org/documentation.html) format.
The HeadlineWidget has the features *headline* and *intro*, each with the property *htmlText*. The *headline* feature has the additional property *level* which has to be a number between one and six.


```json
"headline": {
   "type": "object",
   "description": "The HTML text to be shown as a headline.",
   "properties": {
      "htmlText": {
         "type": "string",
         "description": "The HTML headline content."
      },
      "level": {
         "type": "integer",
         "description": "The hierarchical level of the headline (1 to 6).",
         "minimum": 1,
         "maximum": 6,
         "default": 1
      }
   }
},

"intro": {
   "type": "object",
   "description": "Additional introductory HTML text to be shown below the headline.",
   "properties": {
      "htmlText": {
         "type": "string",
         "description": "The HTML intro content."
      }
   }
}
```

Each object defining a parameter should have a description, may have a default value, may be required or optional and must have a type.
The widget configuration in a page is validated by a JSON schema validator bundled with LaxarJS.
A missing required property in the configuration of a page or a wrong value will result in an error message.
If the validation is successful, an object `features` is created on the `$scope` of the widget template and controller (see below).


### The HTML Template
Next we create the [HTML template](../../includes/widgets/shop_demo/headline_widget/default.theme/headline_widget.html) for our widget.
As the `features` object is available on the `$scope`, we can directly reference the property `$scope.features.headline.htmlText` from the widget configuration using AngularJS directives.

### The Widget Controller
Our very simple HeadlineWidget does not require controller logic.
The [controller definition](../../includes/widgets/shop_demo/headline_widget/headline_widget.js) generated by `grunt-init` already does everything we need:
It defines an AngularJS module and registers the constructor function for the controller, requesting the widget scope as a dependency.
This is the same scope that is available to the template.


### Adding the HeadlineWidget to our Application
With these steps we have completed the simple widget and we can add it to a *page* of the application now.
A page consists of a set of widgets and activities and a layout which defines the arrangement of these elements.
It represents a "screen" within the application flow.
Out of the configured artifacts LaxarJS generates an HTML representation which can be accessed through a URL.
Navigation between pages will be discussed in the next step of the tutorial.
For more information about the concept of the flow, places and pages there is a other [document](../missing_doc.md).

**shop_demo/application/pages/page1.json:**
```json
{
   "layout": "one_column",

   "areas": {
      "activities": [
      ],

      "header": [
         {
            "widget": "shop_demo/headline_widget_widget",
            "features": {
               "headline": {
                  "htmlText": "Hello World!"
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

In the page above we first choose a layout, in this case a very simple one with only one column for content.
LaxarJS will look for the configured layout in the `application/layouts` directory.
Each `data-ax-widget-area` attribute in the HTML template of the layout corresponds to an entry of the `areas` in the JSON page definition.
Within such an area definition the widgets are listed in the order that they should appear in within the browser's DOM tree.
In our ShopDemo application we add the HeadlineWidget to the area called `header`.

Initially the HTML layout `one_column.html` looks like this (we will change it in the next step):
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

Now we can start the application again (`npm start` in the project directory) to see **Hello World!** being displayed in our browser.

## The Next Step
The [next step](03_application_flow.md) is to add a second page to the application, creating the application flow.

[<< Getting Started](01_getting_started.md) | Hello World! | [Application Flow >>](03_application_flow.md)
