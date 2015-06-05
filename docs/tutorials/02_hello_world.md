# Hello, World!

This step is about developing our first LaxarJS widget and integrating it into our application.
We are going to create a simple _HeadlineWidget_ which displays a headline and an optional introductory text.


## What is a Widget?

A LaxarJS application consists of pages, each of which embeds several smaller artifacts, namely widgets and activities.
A _widget_ is responsible for a part of the screen and allows the user to perform specific tasks within the application, while communication with a backend server is often carried out by _activities_.
The technical difference between widgets and activities is that an activity does not render HTML or manipulate the DOM at all and could thus (at least in principle) run on the server, whereas a widget requires the environment provided by a browser.
As every widget and activity is an encapsulated artifact without any JavaScript API, communication among widgets takes place only via the _event bus,_ as we will see later in this tutorial.
For comprehensive information, consult the [widgets and activities manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/widgets_and_activities.md#widgets-and-activities) within the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/index.md#manuals).


## Developing a Simple LaxarJS Widget

The LaxarJS team uses a test-driven development process, so the widgets of the completed ShopDemo application each have a suite of spec tests.
However, in this tutorial we are not going into the details of testing, instead focusing on the basic structure and integration of a LaxarJS application.


### The Base Structure for Widgets

To accelerate the process of developing a widget, we instantiate the _[grunt-init](http://gruntjs.com/project-scaffolding)_ template *laxar-widget*, to generate a basic stub to start from:

```shell
mkdir -p includes/widgets/shop-demo/headline-widget
cd includes/widgets/shop-demo/headline-widget
grunt-init laxar-widget
```

Based on the template that was installed in the [previous step](01_getting_started.md), the _grunt-init_ tool asks for some details about the widget and makes suggestions.
We should change the description and some of the other default answers such as that on licenses.
This information is automatically stored in the files `widget.json` and `bower.json` of the new widget.

```
Please answer the following:
[?] Widget namespace (widgets.shop-demo)
[?] Widget name (headline-widget)
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

Every widget has a `widget.json` file defining its configuration options and a `bower.json` containing dependencies and version-information that can be used with _[bower](http://bower.io)_ for automatic installation.

The files that make up the *actual implementation* are named after the widget, in our case the HeadlineWidget:

* The _widget controller_ (`headline-widget.js`) contains the widget logic, possibly accompanied by AngularJS directives belonging to the widget.
* The _HTML template_ (`default.theme/headline-widget.html`) defines the DOM-structure of the widget. Multiple _themes_ may be implemented for a widget, resulting in multiple directories (not part of this tutorial) but there is always a _default theme._
* The _widget styles_ (`default.theme/css/headline-widget.css`) for styling the widget using _CSS._

Then, there is a jasmine _spec test_ (`spec/headline-widget.spec.js`) for testing the functionality of the widget.
It is accompanied by testing infrastructure files which are usually seldom modified: `spec/spec_runner.js` and `spec/spec_runner.html`.


### Widget Features

In the [widget.json](../../includes/widgets/shop-demo/headline-widget/widget.json) file, there are configuration options for the widget, grouped by *feature*.
Everything that can later be configured when adding the widget to the page is specified here in [JSON schema draft v4](http://json-schema.org/documentation.html) format.
The HeadlineWidget has the features *headline* and *intro*, each with the property *htmlText*.
The *headline* feature has the additional property *level* which has to be a number between one and six.

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

Next we create the [HTML template](../../includes/widgets/shop-demo/headline-widget/default.theme/headline-widget.html) for our widget.
As the `features` object is available on the `$scope`, we can directly reference the property `$scope.features.headline.htmlText` from the widget instance configuration using AngularJS directives.


### The Widget Controller

This very simple HeadlineWidget does not require controller logic.
The [controller definition](../../includes/widgets/shop-demo/headline-widget/headline-widget.js) generated by `grunt-init` already does everything we need:
It defines an AngularJS module and registers the constructor function for the controller, requesting the widget scope as a dependency.
This is the same scope that is available to the template.


### Adding the HeadlineWidget to our Application

With these steps we have completed the simple widget and we can add it to a *page* of the application now.
A page consists of a set of widgets and activities and a _layout_ which defines the arrangement of these elements.
It represents a single "screen" or "step" within the application flow.
Out of the configured artifacts, LaxarJS generates an HTML representation which can be accessed through a URL.
Navigation between pages will be discussed in the next step of the tutorial.
There is also a [manual on writing pages](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/writing_pages.md#writing-pages) containing more information.

Here is a simple page for our demo application:

**shop-demo/application/pages/page1.json:**
```json
{
   "layout": "one_column",

   "areas": {
      "activities": [
      ],

      "header": [
         {
            "widget": "shop-demo/headline-widget",
            "features": {
               "headline": {
                  "htmlText": "Hello, World!"
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

Having added the new widget, we can restart the development server (`npm start` in the project directory) to see **Hello, World!** being displayed in our browser.


## The Next Step

The [next step](03_application_flow.md) is to add a second page to the application, creating the application flow.

[« Getting Started](01_getting_started.md) | Hello, World! | [Defining the Application Flow »](03_application_flow.md)
