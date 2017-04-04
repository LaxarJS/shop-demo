# Hello, World!

This step is about developing our first LaxarJS widget and integrating it into our application.
We are going to create a _headline-widget_ that simply shows a headline, optionally followed by an introductory text.


## What is a Widget?

A LaxarJS application consists of _pages,_ each of which embeds several smaller artifacts, namely _widgets_ and _activities._

A _widget_ is responsible for a part of the screen and allows the user to perform specific tasks within the application, while network communication with any backing services is usually carried out by _activities_.
The technical difference between widgets and activities is that an activity does not render HTML or manipulate the DOM at all, whereas a widget renders UI and is intended for display in the web browser.
As every widget and activity is an isolated artifact with no JavaScript API, communication among widgets takes place solely over the _event bus,_ described later in this tutorial.

For comprehensive information, consult the [widgets and activities manual](https://laxarjs.org/docs/laxar-v2-latest/manuals/widgets_and_activities/) from the [LaxarJS documentation](https://laxarjs.org/docs/laxar-v2-latest/).


## Developing a Simple LaxarJS Widget

A simple widget does not need a lot of code.
However, you can use the Yeoman generator *laxarjs:widget* to quickly setup a starting stub.

```console
yo laxarjs2:widget headline-widget
```

The Yeoman generator that was installed in the [previous step](01_getting_started.md), will now ask for some details about the widget and make suggestions.
You will want to change the description and some of the other default answers as shown below.

*TODO: update to v2 generator*

```console
Please answer the following:
? The widget name (headline-widget)
? Description (optional): Displays a simple headline and an intro html text.
? Licenses: (MIT)
? Project homepage (optional): http://www.laxarjs.org
? Author name (optional): LaxarJS
? Integration technology: plain
? Create project infrastructure (README.md, package.json)? No
```

First, you will learn to create a widget _without_ using a View-Framework such as _Vue.js_, just based on plain web technologies.
For this reason, make sure to pick `"plain"` when asked for an _integration technology._

The headline-widget now consists of the following files:

* A _descriptor_ (named `widget.json`) containing the widget configuration options.

* The _widget controller_ (`headline-widget.js`) contains the widget logic and associated helper functions.

* The _HTML template_ (`default.theme/headline-widget.html`) defines the DOM-structure of the widget.
  Multiple _themes_ may be added for a widget, resulting in multiple directories (not part of this tutorial) but there is always a _default.theme._

* The _widget styles_ (`default.theme/css/headline-widget.css`) for styling the widget using _CSS._

Note that the files that make up the *actual implementation* are named after the widget, in our case the _headline-widget._
Finally, there is a _spec test_ (`spec/headline-widget.spec.js`) for testing the functionality of the widget, for example using [Jasmine](https://jasmine.github.io/).


### Widget Features

The [widget descriptor](../../application/widgets/headline-widget/widget.json) contains configuration options for the widget, grouped by *feature*.
Everything that should be configurable when adding the widget to a page is specified here in [JSON schema](http://json-schema.org/) notation.
Before instantiating your widget into a page, LaxarJS validates its configuration using a [schema validator](https://www.npmjs.com/package/ajv), filling in the defaults as needed.

Note that this is not required for LaxarJS widgets:
If you remove the `features` block from the `widget.json`, your widget will simply accept _any_ configuration!
However, using a schema is _recommended_ because it automatically documents and checks the configuration options for your widget.

Let us now specify the features *headline* and *intro*, each with a property *htmlText*.
To do this, use the following definition as *properties* of the *features* object in your `widget.json`:

```json
{
   "headline": {
      "type": "object",
      "description": "The HTML text to be shown as a headline.",
      "required": [ "htmlText" ],
      "properties": {
         "htmlText": {
            "type": "string",
            "description": "The HTML headline content."
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
}
```

JSON schemas are nested (corresponding to the tree-like structure of JSON documents), where each property sub-schema _must_ have a _type,_ should have a _description,_ and may have a _default_ value (or be listed as _required_ by its parent schema).
However, this is just the tip of the iceberg.
The possibilities of JSON schema are enormous: for further study, refer to the [JSON schema documentation](http://json-schema.org/documentation.html).

Pages that violate your widget's schema definition will cause an error to be reported in your terminal, since schemas are processed _at build-time_.
If on the other hand the validation was successful, the widget controller (see below) will be able to access its feature configuration.


### The HTML Template

Next, create an [HTML template](../../application/widgets/headline-widget/default.theme/headline-widget.html) for your new widget.
Corresponding to the widget features, the template consists of an HTML element for the actual headline, followed by a paragraph for the intro text.

```html
<h2 class="headline-html-text"></h2>
<p class="intro-html-text"></p>
```

The HTML template is selected based on the configured theme, and loaded as your widget's DOM (document object model).
In _plain widgets,_ the JavaScript widget controller will be notified when the template HTML has been loaded, so that it can add dynamic contents.

In the upcoming chapters, you will learn how to create a _Vue.js_ template for yuor widget, which is a lot more powerful than a plain HTML template.


### The Widget Controller

The _headline-widget_ does nothing fancy.
[Its controller](../../includes/widgets/shop-demo/headline-widget/headline-widget.js) just needs to put the configured _headline_ and _intro_ HTML into the widget DOM:

```js
export const injections = [ 'axFeatures' ];
export function create( features ) {
   return {
      onDomAvailable( dom ) {
         [ 'headline', 'intro' ].forEach( feature => {
            const html = features[ feature ].htmlText;
            const element = dom.querySelector( `.${feature}-html-text` );
            if( html ) {
               element.innerHTML = html;
            }
            else {
               element.remove();
            }
         } );
      }
   };
}
```

First, note that this widget controller uses [EcmaScript 2015](https://babeljs.io/learn-es2015/).
Because not all browsers support this syntax, your application is set up for automatic _transpilation_ to regular JavaScript (EcmaScript 5) code.
Under the hood, this transpilation is performed by [webpack](https://webpack.js.org/) and [Babel](http://babeljs.io/).

Let us dissect the controller step-by-step:

  - first, `injections` are exported, telling the LaxarJS runtime that this widget controller wants to read the widget feature configuration (to get the configuration for _headline_ and _intro_),

  - then, a `create` function is exported, which is called for each _instance_ of this widget, on any page.
  Its arguments correspond to the requested injections,

  - the `create` function returns an object with a single `onDomAvailable` hook. As soon as the widget is rendered, that hook is called with the parsed contents of our HTML template. Our widget controller simply applies the feature configuration to the HTML elements that were already prepared by the template. In case no _htmlText_ is specified for a feature, the corresponding element is discarded using `remove()`.

Note that you should _never put user-input_ (from input fields or the URL) into `innerHTML`.
In this case however, we know that the `htmlText` comes from the page configuration, so we regard it as trusted.

While this is not a lot of code, you may think that just displaying two HTML texts should be even simpler.
Because we feel the same way, LaxarJS allows to easily create widgets using popular templating technologies such as _Vue.js_.
We just wanted to demonstrate how you can create widgets without adding fancy frameworks, by using the `"plain"` integration technology.
For anything more complex, you may want to chose a different integration technology, as will be described in the next step.


### Adding the Widget to Your Application

Now that you have created a simple widget, you will need to add it to a *page* of the application so that it can be displayed.
A page combines _JSON configuration_ for a number of widgets and activities with an _HTML layout_ to visually arrange the widgets.
Each page represents a single "screen" or "step" within the application _flow._
There is also a [manual on writing pages](https://laxarjs.org/docs/laxar-v2-latest/manuals/writing_pages/) with more information.

*TODO: Use defaults from generator where possible. Provide additional instructions where not.*

Let us start with this simple page for our demo application, and save it as `home.json` under `application/pages`:

```json
{
   "layout": "one-column",

   "areas": {
      "content": [
         {
            "widget": "headline-widget",
            "features": {
               "headline": {
                  "htmlText": "Hello, World!"
               }
            }
         }
      ]
   }
}
```

Each page specifies a _layout_, a skeleton HTML-file providing special insertion points (_widget areas_) that determine where the configured widget instances will go.
In this case, let us use a simple one-column layout.
LaxarJS will look for the configured layout in the `application/layouts` directory.
Like widgets, layouts contain _theme folders_ that allow HTML and/or CSS to be overwritten based on the configured theme.

Here is the HTML of the layout `one-column` using the `default.theme`.
Save it as `one-column/default.theme/one-column.html` within the `application/layouts` directory:

```html
<div class="one-column-layout container">
   <div data-ax-widget-area="content"></div>
</div>
```

Each `data-ax-widget-area` attribute in the layout's HTML corresponds to one of the `areas` within the JSON page definition.
The widget's configured for that area (if any) are inserted as DOM children of the widget area element, in the order they are configured.

Within such an area definition the widgets are listed in the order that they should appear in within the browser's DOM tree.
In our ShopDemo application we add the headline-widget to the area called `header`.

*TODO: Verify that stopping/restarting the development server is still needed in LaxarJS v2*

Having added the new widget, we can restart the development server (`npm start` in the project directory) to see **Hello, World!** being displayed in our browser.


### Testing your Widget

The LaxarJS team uses a test-driven development process, so the widgets of the completed ShopDemo application each have a suite of spec tests.
Using the [LaxarJS Mocks](https://laxarjs.org/docs/laxar-mocks-v2-latest) library, you can quickly create tests for your widgets and activities.
However, in this tutorial we are not going into the details of testing, and instead focusing on the basics of a LaxarJS application.
In case you are curious, here is [a simple test](../../application/widgets/headline-widget/spec/headline-widget.spec.js) for the `headline-widget` created in this step.


## The Next Step

The [next step](03_application_flow.md) is to add a second widget to the application, and learning about the _event bus._

[« Getting Started](01_getting_started.md) | Hello, World! | [The article-browser-widget »](03_article_browser_widget.md)
