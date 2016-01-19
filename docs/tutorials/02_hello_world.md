# Hello, World!

This step is about developing our first LaxarJS widget and integrating it into our application.
We are going to create the simple _headline-widget_ which displays a headline and an optional introductory text.


## What is a Widget?

A LaxarJS application consists of pages, each of which embeds several smaller artifacts, namely widgets and activities.
A _widget_ is responsible for a part of the screen and allows the user to perform specific tasks within the application, while communication with a backend server is often carried out by _activities_.
The technical difference between widgets and activities is that an activity does not render HTML or manipulate the DOM at all and could thus (at least in principle) be run on the server, whereas a widget requires the environment provided by a browser.
As every widget and activity is an isolated artifact without any JavaScript API, communication among widgets takes place only via the _event bus,_ as we will see later in this tutorial.
For comprehensive information, consult the [widgets and activities manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/widgets_and_activities.md#widgets-and-activities) from the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/index.md#manuals).


## Developing a Simple LaxarJS Widget

The LaxarJS team uses a test-driven development process, so the widgets of the completed ShopDemo application each have a suite of spec tests.
However, in this tutorial we are not going into the details of testing, and will instead focus on the basics of a LaxarJS application.


### The Base Structure for Widgets

To accelerate the process of developing a widget, we use the Yeoman generator *laxarjs:widget*, to generate a basic stub for us to start from:

```shell
yo laxarjs:widget headline-widget --directory=includes/widgets/shop-demo/
```

The Yeoman generator that was installed in the [previous step](01_getting_started.md), will now ask for some details about the widget and make suggestions.
We want to change the description and some of the other default answers as shown below.

```
Please answer the following:
? The widget name (headline-widget)
? Description (My new LaxarJS widget): Displays a simple headline and an intro html text.
? Licenses (none): MIT
? Project homepage (optional): http://www.laxarjs.org
? Author name (optional): LaxarJS
? Integration technology: angular
? Create project infrastructure (README.md, bower.json)? No
```

The headline-widget now consists of the following files:

Every widget has a _descriptor_ (`widget.json`) containing its configuration options and (optionally) a _Bower manifest_ (`bower.json`) containing dependencies and version-information that can be used with _[Bower](http://bower.io)_ for automatic installation.

The files that make up the *actual implementation* are named after the widget, in our case the headline-widget:

* The _widget controller_ (`headline-widget.js`) contains the widget logic, possibly accompanied by AngularJS directives belonging to the widget.

* The _HTML template_ (`default.theme/headline-widget.html`) defines the DOM-structure of the widget.
  Multiple _themes_ may be implemented for a widget, resulting in multiple directories (not part of this tutorial) but there is always a _default theme._

* The _widget styles_ (`default.theme/css/headline-widget.css`) for styling the widget using _CSS._

Then, there is a jasmine _spec test_ (`spec/headline-widget.spec.js`) for testing the functionality of the widget.
It is accompanied by testing infrastructure files which are usually seldom or never modified: `spec/spec_runner.js` and `spec/spec_runner.html`.


### Widget Features

The [widget.json](../../includes/widgets/shop-demo/headline-widget/widget.json) descriptor contains configuration options for the widget, grouped by *feature*.
Everything that can later be configured when adding the widget to the page is specified here in [JSON schema draft v4](http://json-schema.org/documentation.html) notation.
Lets give our headline-widget the features *headline* and *intro*, each with a property *htmlText*.
The *headline* feature has the additional property *level* which we make sure to be a number between one and six.

```json
"headline": {
   "type": "object",
   "description": "The HTML text to be shown as a headline.",
   "required": [ "htmlText" ],
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

Each object defining a parameter _must_ have a type, should have a _description_ and may have a _default_ value as well as (for objects) a list of _required_ properties.
When our widget is instantiated on a page, its configuration is validated against this schema by a JSON schema validator bundled with LaxarJS, and the defaults are filled in.
A required property that is missing from the configuration of a page or a value of the wrong type will result in an error message within the browser console.
If the validation was successful, the actual instance configuration is available as property `features` on the `$scope` to the AngularJS widget template and controller (see below).


### The HTML Template

Next we create the [HTML template](../../includes/widgets/shop-demo/headline-widget/default.theme/headline-widget.html) for our widget.
As the `features` object is available on the `$scope` and the template is compiled by AngularJS, we can directly reference the property `$scope.features.headline.htmlText` from the widget instance configuration using AngularJS directives.


### The Widget Controller

The headline-widget is an exceptionally simple widget that does not require any sophisticated controller logic.
The [controller definition](../../includes/widgets/shop-demo/headline-widget/headline-widget.js) generated by Yeoman already does everything we need:
It defines an AngularJS module and registers the constructor function for the controller, requesting the widget scope as a dependency.
This is the same scope that is available to the template.


### Adding the headline-widget to our Application

With these steps we have created our simple widget which we can add to a *page* of the application now.
A page consists of a set of widgets and activities and a _layout_ which defines the arrangement of these elements.
It represents a single "screen" or "step" within the application flow.
Out of the configured artifacts, LaxarJS generates an HTML representation which can be accessed through a URL.
Navigation between pages will be discussed in the next step of the tutorial.
There is also a [manual on writing pages](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/writing_pages.md#writing-pages) containing more information.

Let us start with this simple page for our demo application, and save it as `home.json` under `application/pages`:

```json
{
   "layout": "one-column",

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

In the page above we first choose a _layout_, in this case a very simple one with only one column for content.
The layout is an HTML skeleton making sure that the individual widgets are arranged correctly on the screen, and that may contain additional static elements such as a copyright footer.
LaxarJS will look for the configured layout in the `application/layouts` directory.
Each `data-ax-widget-area` attribute in the HTML template of the layout corresponds to an entry of the `areas` in the JSON page definition.
Within such an area definition the widgets are listed in the order that they should appear in within the browser's DOM tree.
In our ShopDemo application we add the headline-widget to the area called `header`.

Initially the HTML layout `one-column.html` defines three widget areas.
For now we remove the `<header class="page-header">...</header>` that was added by the application template, and arrive at the following:

```html
<div class="one-column-layout container">
   <header data-ax-widget-area="header">
   </header>

   <div data-ax-widget-area="content">
   </div>

   <footer data-ax-widget-area="footer">
   </footer>
</div>
```

Having added the new widget, we can restart the development server (`npm start` in the project directory) to see **Hello, World!** being displayed in our browser.


## The Next Step

The [next step](03_application_flow.md) is to add a second page to the application, creating the application flow.

[« Getting Started](01_getting_started.md) | Hello, World! | [Defining the Application Flow »](03_application_flow.md)
