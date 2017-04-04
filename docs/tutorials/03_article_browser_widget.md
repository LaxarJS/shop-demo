# The article-browser-widget

In this step we are going to implement the _article-browser-widget_ which displays a list of articles to the user and allows to select an individual article.
To obtain the articles in the first place, we also create an _activity_.
Another widget (to be implemented in the next step) will show details on the currently selected article.
This part of the tutorial will allow you to learn how widgets safely share resources through the event bus, and how resources can be displayed to the user.


## Creating an Activity

Our first task is to create a _dummy-articles-activity_ that has _one job:_ publish a resource that contains a list of _articles_.
Each article in the list has a title, a price and an HTML description, plus a URL to a teaser image.

Because activities have no visual appearance, all we need to do is to create the activity using `yo laxarjs:activity`, allow configuration of an _event bus topic,_ and implement the activity controller.

Create the activity using the Yeoman generator, again selecting the integration technology *plain*:

```console
yo laxarjs2:activity dummy-articles-activity
```

For activities, you should generally use `"plain"` as they do not need fancy UI support in the first place.
You will learn about another integration technology (`"vue"`) in the next section.
First, let us add the feature configuration option to the activity's [descriptor](../../application/widgets/dummy-articles-activity/widget.json):

```json
"articles": {
   "required": [ "resource" ],
   "type": "object",
   "properties": {
      "resource": {
         "type": "string",
         "format": "topic",
         "axRole": "outlet"
      }
   }
}
```

We just added a _configurable event bus topic_ to our activity, in this case the name of a _resource_.
The activity will publish a list of available articles under this topic.
Using the page configuration, we will use this to _connect_ widgets and activities by having them _share the same_ event bus topics.
The _format_ `"topic"` is used to check if the page configuration uses a valid event bus topic (containing just letters, numbers and dashes).
Finally, `"axRole"` is a schema-property defined by LaxarJS: It indicates that this activity _publishes_ the configurable resource.

Now, you can implement the [activity controller](../../application/widgets/dummy-articles-activity/dummy-articles-activity.js):

```javascript
import { articles as entries } from './articles';

export const injections = [ 'axEventBus', 'axFeatures' ];
export function create( eventBus, features ) {
   eventBus.subscribe( 'beginLifecycleRequest', () => {
      const { resource } = features.articles;
      eventBus.publish( `didReplace.${resource}`, { resource, data: { entries } } );
   } );
}
```

The structure of the controller is very similar to that of the _headline-widget_ created in the previous step:
First, a [static list of articles](../../application/widgets/articles.js) is imported.
In an actual web shop, you would probably make a _fetch_ request to a REST API to get the articles from a database.

Then, you have the two exports (_injections_ and _create_) like in the _headline-widget_.
This time the activity requests another injection: the _event bus_, allowing us to communicate with the rest of the page.
Also, this time no `onDomAvailable` callback is returned, because an activity has no HTML template.


#### Your First Event

Once created, the activity _subscribes_ to the _event_ `beginLifecycleRequest`.
This event is published by LaxarJS itself, and indicates that all widget and activity controllers have been created and have set up their own event bus subscriptions.
The callback to subscribe is invoked when the corresponding event has been received.
We use it to _publish_ an event of our own: the `didReplace` event, which announces a new version of a resource to all interested subscribers.
To identify _which_ resource we have replaced, we specify its name using the second topic of our event (the part after the dot).
As _payload_ of our event, we also provide the configured _resource_ name, along with the _data_ imported from the articles list.

If you would like to know more about events, there is [a manual on events](https://laxarjs.org/docs/laxar-v2-latest/manuals/events/) as well as the [event bus API reference]https://laxarjs.org/docs/laxar-v2-latest/api/runtime.event_bus.md)
The format of the didReplace event and its payload is not arbitrary, it follows the so-called _resource pattern_, allowing widgets to collaborating without even knowing which other widgets are there.
The [LaxarJS patterns documentation]() has more information on these patterns.


### Adding the Activity to the Page

Each page in LaxarJS supports a special area `"activities"` as a natural container for these invisible helpers.
Simply add the following area definition as a sibling to the existing `"content"` area:

```json
"activities": [
   {
      "widget": "dummy-articles-activity",
      "features": {
         "articles": {
            "resource": "articles"
         }
      }
   }
],
```

Now you a have dummy-article-activity, configured to publish articles over the event bus using the `"articles"` topic.
Of course, you would like to see these articles on screen.
So, let us create an _article-browser-widget_.


## Creating the article-browser-widget

This is what the final article-browser-widget will look like:

![article-browser-widget](img/article_browser_widget.png)

It displays a heading, followed by a table containing the list of available articles.
In the image, the sixth row represents the currently selected article.

Again, start by creating the widget using the generator:

```console
yo laxarjs2:widget article-browser-widget
```

This time, make sure to pick `"vue"` as the integration technology.
Using this technology mean that your widget is a _Vue.js_ component at the same time: [article-browser-widget.vue](../../application/widgets/article-browser-widget/article-browser-widget.vue)!
Compared to a `"plain"` widget, this should make it much simpler to synchronize HTML DOM and data.

Going into a full-depth explanation of Vue.js would take things too far, especially considering that there is a comprehensive [Guide on Vue.js](https://vuejs.org/v2/guide/) anyway.
Let us quickly cover the basics:

  - a Vue.js _component_ consists of an HTML template, a JavaScript object and optional CSS styles - much like a LaxarJS widget,

  - the template may contain _bindings_ to render data from the JS object, and _events_ to trigger methods of the object,

  - the object contains the "business logic", interpreting events from the template (or from the event bus) in order to change the data for the template,

  - LaxarJS connects your components to the event bus, provides various injections, and takes care of theming as needed.

At first, your component is empty:

```vue
<template>
</template>

<script>
</script>
```

Let us now look at the features of the article-browser-widget widget, and extend the component accordingly.


### The Features of the article-browser-widget

The widget configuration supports two features: display a list of *articles* and allow *selection* of an article.


#### Displaying a List of Articles

*TODO: line numbers*

For the first feature [*articles*](../../application/widgets/article-browser-widget/widget.json), we allow to configure the name of the resource containing the articles.
Here is an appropriate JSON schema:

```json
"articles": {
   "type": "object",
   "description": "Display a list of articles.",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "Name of the data resource with articles.",
         "format": "topic",
         "axRole": "inlet"
      }
   }
}
```

Note that this closely resembles the configuration used for the _dummy-articles-activity_, only that you are using the role _inlet_ this time.
This indicates that your activity _subscribes_ to the configured resource.

Because the widget would be useless without a list of articles to render, we define the `resource` property as `required` in the feature schema.
The implementation of the [controller](../../application/widgets/article-browser-widget/article-browser-widget.vue) starts out like this:

```vue
<template>

</template>

<script>
export default {
   data: () => ({
      articles: { entries: [] }
   }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.articles.resource}`, ({ data }) => {
         this.articles = data;
      } );
   }
};
</script>
```

The widget listens for _didReplace_-events and updates the contents of `$scope.resources` accordingly so that the template will reflect the new state of the resource.
It also resets the currently selected article (see below).

For the desired appearance, we modify the [HTML template](../../includes/widgets/shop-demo/article-browser-widget/default.theme/article-browser-widget.html) to display articles contained in the resource, or a hint that currently there are no articles available.
Basic widget styles are implemented using a [CSS stylesheet](../../includes/widgets/shop-demo/article-browser-widget/default.theme/css/article-browser-widget.css).


### Allowing the User to Select an Article

Now we'll cover the second feature of the article-browser-widget, called [*selection*](../../includes/widgets/shop-demo/article-browser-widget/widget.json#L29-40):

```json
"selection": {
   "type": "object",
   "description": "Select an article.",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "Name of the resource for the user selection",
         "format": "topic"
      }
   }
}
```

This feature requires the configuration of a resource name under which the selected article will be published on the event bus.
In our application the article-teaser-widget and the shopping-cart-widget (implemented in the next steps) will listen for changes to this resource.

In our [HTML template](../../includes/widgets/shop-demo/article-browser-widget/default.theme/article-browser-widget.html#L25) we use the directive `ngClick` to detect the selection of an article by the user:

```html
<tr class="selectable"
    data-ng-repeat="article in resources.articles.entries"
    data-ng-click="selectArticle( article )"
    data-ng-class="{ selected: article.id === selectedArticle.id }">...</tr>
```

To give the user a visual feedback of the selected article, `ngClass` is used.

Finally, we implement the method [`$scope.selectArticle`](../../includes/widgets/shop-demo/article-browser-widget/article-browser-widget.js#L26-34) which is invoked by `ngClick`.
It publishes the selected article on the event bus:

```javascript
$scope.selectArticle = function( article ) {
   $scope.selectedArticle = article;

   var selectionResource = $scope.features.selection.resource;
   eventBus.publish( 'didReplace.' + selectionResource, {
      resource: selectionResource,
      data: article
   } );
};
```


### Adding the article-browser-widget to our Application

We update the [*shop_demo* page](../../application/pages/shop_demo.json#L30-42) and add the article-browser-widget to the area `contentA`:

```json
"contentA": [
   {
      "widget": "shop-demo/article-browser-widget",
      "features": {
         "articles": {
            "resource": "filteredArticles"
         },
         "selection": {
            "resource": "selectedArticle"
         }
      }
   }
]
```

Because the article-search-box-widget is configured to publish the filtered list of articles under the name [*filteredArticles*](../../application/pages/shop_demo.json#L24), we configure the article-browser-widget accordingly.
The selection resource will be used in the next step of this tutorial.
Now we have the following setup:

![Step 5](img/step5.png)

Note that since the resource topics are configurable on all participating widgets, we could change the way that we obtain or display our articles anytime.
For example, we could add a new activity to read articles from a web service, without having to touch any of the existing widgets.
Alternatively, we could simply cut out the middle-man by removing the article-search-box-widget completely:
Then, we would simply rewire the dummy articles and feed them into our browser widget directly, just by editing the page configuration.
This _resource pattern_ is one of several collaboration patterns that are commonly used with LaxarJS, and is described in more detail in the [resource manual](https://github.com/LaxarJS/laxar-patterns/blob/master/docs/patterns/resources.md#resource-patterns) of the [LaxarJS Patterns](https://github.com/LaxarJS/laxar-patterns) documentation.

To have a look at our article browser, we stop the server if we have not already (`Ctrl-C`) and start it again using `npm start`.
The application should allow to select among ten articles now, and display a search box at the top of the browser window.


## The Next Step

The next step is to add the [article-teaser-widget](06_article_teaser_widget.md) in order to display details on the selected article.

[« The article-search-box-widget](04_article_search_box_widget.md) | The article-browser-widget | [The article-teaser-widget »](06_article_teaser_widget.md)
