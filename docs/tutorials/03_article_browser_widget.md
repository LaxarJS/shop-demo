# The article-browser-widget

In this step we are going to implement the _article-browser-widget_ which displays a list of articles to the user and allows to select an individual article.
To obtain the articles in the first place, we also create an _activity_.
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

We just defined a _configurable event bus topic_ for our activity, in this case the name of a _resource_.
The activity will publish a list of available shopping articles under this topic.
Using the page configuration, we will use the topic to _connect_ widgets and activities by _assigning shared event bus topics._
The _format_ `"topic"` is used to check if the page configuration uses a valid event bus topic (containing just letters, numbers and dashes).
Finally, `"axRole"` is a schema-property defined by LaxarJS: It indicates that this activity _publishes_ the configurable resource.

Now, you can implement the [activity controller](../../application/widgets/dummy-articles-activity/dummy-articles-activity.js):

```javascript
import { articles } from './articles';

export const injections = [ 'axEventBus', 'axFeatures' ];
export function create( eventBus, features ) {
   eventBus.subscribe( 'beginLifecycleRequest', () => {
      const { resource } = features.articles;
      eventBus.publish( `didReplace.${resource}`, { resource, data: articles } );
   } );
}
```

The structure of the controller is very similar to that of the _headline-widget_ created in the previous step:
First, a [static list of articles](../../application/widgets/articles.js) is imported.
In an actual web shop, you would probably make a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) request to a REST API to get the articles from a database.

Then, you have the two exports (_injections_ and _create_) like in the _headline-widget_.
This time the activity requests an additional injection: the _event bus_, allowing us to communicate with the rest of the page.
Also, this time no `onDomAvailable` callback is returned, because an activity has no HTML template.


#### Your First Event

Once created, the activity _subscribes_ to the _event_ `beginLifecycleRequest`.
This event is published by LaxarJS itself, and indicates that all widget and activity controllers have been created and have set up their own event bus subscriptions.
The callback to subscribe is invoked when the corresponding event has been received.
We use it to _publish_ an event of our own: the `didReplace` event, which announces a new version of a resource to all interested subscribers.
To identify _which_ resource we have replaced, we specify its name using the second topic of our event (the part after the dot).
As _payload_ of our event, we also provide the configured _resource_ name, along with the _data_ imported from the articles list.

If you would like to know more about events, there is [a manual on events](https://laxarjs.org/docs/laxar-v2-latest/manuals/events/) as well as the [event bus API reference](https://laxarjs.org/docs/laxar-v2-latest/api/runtime.event_bus/).
The format of the didReplace event and its payload is not arbitrary, it follows the so-called _resource pattern_, allowing widgets to collaborate without directly depending on another.
The [LaxarJS patterns documentation](https://laxarjs.org/docs/laxar-patterns-v2-latest/) has more information on these patterns.


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
Using this technology mean that your widget is a _Vue.js_ component (saved as `article-browser-widget.vue`) at the same time.
Compared to a `"plain"` widget, this should make it much simpler to synchronize HTML DOM and data.

Going into a full-depth explanation of Vue.js would take things too far, especially considering that there is a comprehensive [Guide on Vue.js](https://vuejs.org/v2/guide/) anyway.
Let us quickly cover the basics:

  - a Vue.js _component_ consists of an HTML template, a JavaScript object and optional CSS styles - much like a LaxarJS widget,

  - the template may contain _bindings_ to render data from the JS object, and _event handlers_ to trigger methods of the object,

  - the object contains the "business logic", interpreting events from the template (or from the event bus) in order to change the data for the template,

  - LaxarJS connects your components to the event bus, provides various injections, and takes care of theming as needed.

At first, your component is empty:

```vue
<template>
</template>

<script>
</script>
```

Let us now look at the features of the article-browser-widget widget, and implement the component accordingly.


### The Features of the article-browser-widget

The widget configuration supports two features: display a list of *articles* and allow *selection* of an article.


#### Displaying a List of Articles

For the first feature *articles*, we allow to configure the name of the resource containing the articles.
Here is an appropriate JSON schema that you can add to the *properties* of you [widget descriptor](../../application/widgets/article-browser-widget/widget.json) features:

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
The implementation of the _vue component_ starts out like this:

```vue
<template>
<div>
   <h3><i class="fa fa-gift"></i> Articles</h3>
   <table v-if="articles.length"
      class="table table-hover table-striped">
      <thead>
         <tr>
            <th>Art. ID</th>
            <th>Article</th>
            <th>Price</th>
         </tr>
      </thead>
      <tbody>
         <tr v-for="article in articles">
            <td>{{ article.id }}</td>
            <td>{{ article.name }}</td>
            <td>{{ article.price }}</td>
         </tr>
      </tbody>
   </table>
</div>
</template>

<script>
export default {
   data: () => ({
      articles: []
   }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.articles.resource}`, event => {
         this.articles = event.data;
      } );
   }
};
</script>
```

The template contains a headline, using the [Font Awesome](http://fontawesome.io/) icon `fa-gift`.
Font Awesome is automatically available when using the LaxarJS _default.theme_.
The same goes for the [Bootstrap CSS classes](https://getbootstrap.com/css/#tables) used here, causing table rows to use alternating colors.

A table renders the `articles` from the component data, one row per article.
The _Vue.js directive_ `v-if` is used to show the header row only if there are any articles.
Another directive `v-for` is used to loop over the list of available articles, and render a table row for each of them.
Vue.js binding expressions (sometimes also called _mustache_ expressions, because they are surrounded by `{{ }}`) are used to render the properties of each article.
The surrounding `div` is required because Vue.js requires that component templates have only a single direct child element.

The controller object has a `data` method to initialize the properties available for binding in the template.
It also has a `created` method (much like the `create` function exported by the plain activity).
The `created` method subscribes to _didReplace_-events for the configured resource and updates the component articles accordingly, which is then automatically reflected by the template.
Make sure not to confuse the `data` method of the _Vue.js_ component (defined by the [Vue.js component API](https://vuejs.org/v2/api/#Options-Data)) with the `data` property of the `didReplace` event (defined by the [LaxarJS resource pattern](https://laxarjs.org/docs/laxar-patterns-v2-latest/patterns/resources/)).

Note that being a _widget controller_, this object automatically has access to certain additional properties provided by LaxarJS:
Most prominently, there are the `eventBus` (corresponding to the `axEventBus` injection seen in the _dummy-articles-activity_), and `features` (corresponding to `axFeatures`).
For full information on the `"vue"` integration technology, consult the [Vue.js adapter documentation](https://laxarjs.org/docs/laxar-vue-adapter-v2-latest/).


### Allowing the User to Select an Article

Now we'll cover the second feature of the article-browser-widget, called *selection*.
For this you'll need to add another feature configuration schema, so that the widget can publish the currently selected article under a configurable name:

```json
"selection": {
   "type": "object",
   "description": "Select an article.",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "Name of the resource for the user selection",
         "format": "topic",
         "axRole": "outlet"
      }
   }
}
```

This will allow other widgets (created over the next steps) to display details on the currently selected article, and to add it to the shopping cart.
Let us modify the component as follows:

```vue
<template>
   <!-- ... headline, table, thead ... -->
   <tr v-for="article in articles"
      @click="selectArticle( article )"
      :class="{ selected: article.id === selectedArticle.id }">
      <!-- cells -->
   </tr>
   <!-- ... closing tags ... -->
</template>

<script>
export default {
   data: () => ({
      selectedArticle: { id: null },
      articles: []
   }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.articles.resource}`, event => {
         this.articles = event.data;
         this.selectArticle( null );
      } );
   },
   methods: {
      selectArticle( data ) {
         this.selectedArticle = data || { id: null };
         const { resource } = this.features.selection;
         this.eventBus.publish( `didReplace.${resource}`, { resource, data } );
      }
   }
};
</script>
```

Now, the component has another data attribute, the current `selectedArticle`.
It exposes a _method_ `selectArticle` to allow changing the selection, which also _publishes_ the article over the event bus.

The template uses a _method binding_ (`@click`) to update the selection when the user clicks a row.
It also uses an _attribute binding_ (`:class`) to visually highlight the currently selected article.
Both of these are provided by Vue.js, and not specific to using the component as a LaxarJS widget.


### Adding the article-browser-widget to our Application

Finally, we need to add our new widget to the `"content"` area of the *home* page.
To recapitulate, here is the entire page configuration, with the _headline-widget_ from the previous step along with the _dummy-articles-activity_ and the _article-browser-widget_:

```json
{
   "layout": "one-column",

   "areas": {
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
      "content": [
         {
            "widget": "headline-widget",
            "features": {
               "headline": {
                  "htmlText": "LaxarJS ShopDemo"
               }
            }
         },
         {
            "widget": "article-browser-widget",
            "features": {
               "articles": {
                  "resource": "articles"
               },
               "selection": {
                  "resource": "selectedArticle"
               }
            }
         }
      ]
   }
}
```

Most importantly, the _dummy-articles-activity_ and the _article-browser-widget_ share the same event bus topic (`"articles"`).
This effectively _connects_ the two artifacts, without their implementations knowing about each other, and without need for additional glue code.
You can see that we also changed the headline text to `"LaxarJS ShopDemo"`, but feel free to pick a title of your own.

*TODO: event wiring diagram*


### Styling the Widget using SCSS

By following these steps, you have created your first _interactive_ widget.
But compared to the image above, it does not look quite right.
The reason is that there is no CSS styling yet!

While you styled the _headline-widget_ using plain old CSS, let us go for something more sophisticated with this widget by using [SCSS](http://sass-lang.com/) instead.
The SCSS language is a superset of CSS, meaning that all CSS code is also valid SCSS.
In addition, SCSS defines useful additions such as `$variables`, and `.nested { .selectors {} }`.
We recommend using SCSS rather than CSS for any non-trivial styling.
Since the goal of this tutorial is teaching LaxarJS rather than CSS or SCSS, go ahead and grab the [prepared SCSS file](../../application/widgets/article-browser-widget/default.theme/scss/article-browser-widget.scss) for now, saving its contents under `default.theme/scss/article-browser-widget.scss`.

As briefly mentioned above, you could alternatively have put the styles into a `<style type="scss">` section of your `.vue` component definition.
However, using a dedicated file enables you to swap out the styles by changing the _theme_, which is explained in the [final step](08_final_steps.md) of this tutorial.

Because LaxarJS only looks for regular CSS files (not SCSS) _by default,_ you need to add some information to the widget descriptor:

```json
   "styleSource": "scss/article-browser-widget.scss",
```

Because webpack was pre-configured by the LaxarJS application generator to process all `.scss` files with [libsass](http://sass-lang.com/libsass), this should work out-of-the-box.
You can remove the original `.css` file of the widget as it is no longer needed.
To make best use of the additional style definitions, you'll need to add more CSS classes to your widget template.
Refer to the [full component template](../../application/widgets/article-browser-widget/article-browser-widget.vue) for details.

When visited in the browser, your application should allow to select among ten articles now, and highlight the article that was selected by clicking.


## The Next Step

The next step is to add the [article-teaser-widget](04_article_teaser_widget.md) in order to display a detailed preview of the selected article.

[« Hello, World!](02_hello_world.md) | The article-browser-widget | [The article-teaser-widget »](04_article_teaser_widget.md)
