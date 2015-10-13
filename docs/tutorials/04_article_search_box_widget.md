# The article-search-box-widget

By this time, our application only displays a headline and does not allow the user to do anything.
To change this we implement the _dummy-articles-activity_ that provides articles for us, simulating an actual network-based data source.
Also, we add another widget, the  _article-search-box-widget,_ helping us to filter articles by name and description.
The activity and widget will use *events* to publish and filter a list of articles to each other and to other widgets.

After going through this chapter, you will be familiar with the event bus and how it is accessed by a widget.
It is recommended to have a look at the manual about [events and publish-subscribe](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md#events-and-publish-subscribe) first, to allow for a better understanding.


## Creating the dummy-articles-activity

This dummy activity has _one job:_ publish a resource that contains a list of _articles_.
Each article in the list has title, price, and description as well as a URL to a teaser image.

Because activities have no visual appearance, all we need to do is to create the activity using `grunt-init laxar-activity`, allow configuration of an event bus topic, and implement the activity controller.

First, let us add the feature configuration option to the activity's [descriptor](../../includes/widgets/shop-demo/dummy-articles-activity/widget.json#L16-26):

```json
"articles": {
   "required": [ "resource" ],
   "type": "object",
   "properties": {
      "resource": {
         "type": "string",
         "format": "topic"
      }
   }
}
```

The only configuration option is the resource topic under which to publish our articles resource.
Using the format `topic` ensures that only valid event bus topic IDs will be configured.


Then, we can implement the [controller](../../includes/widgets/shop-demo/dummy-articles-activity/dummy-articles-activity.js#L13-23):

```javascript
function Controller( context, eventBus ) {
   eventBus.subscribe( 'beginLifecycleRequest', function() {
      var articleResource = context.features.articles.resource;
      eventBus.publish( 'didReplace.' + articleResource, {
         resource: articleResource,
         data: { entries: articles }
      } );
   } );
}
```

First the controller waits for the _beginLifecycleRequest_ event, to make sure that all other widgets are ready to receive.
Then it uses the feature configuration to determine the _topic_ under which to publish the articles.

The actual `articles` list has already been loaded from a [static file](../../includes/widgets/shop-demo/dummy-articles-activity/articles.js), and is now published under the `data` property of a _didReplace_ event.
For this, the method `eventBus.publish` is used, which expects three parameters: *name, payload* and (if needed) additional *options*:

* The _event name_ for this event consists of the event type (`didReplace`), a dot as a topic separator, and the resource name.

* The _event payload_ has two properties in this case, namely the configured *resource* (`$scope.features.articles.resource`) and the articles as data.
  Note that the example uses the configured topic as part of the event name (to allow for subscription-based filtering) as well as in the event *payload* for inspection by the receiver.

* The additional _options_ are not required most of the time.
  Have a look at the [events manual](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md) for the full story.

When publishing an *array* as a resource on the event bus, it is a good idea to always wrap it as an *entries* property of an *object*, like we do here.
This allows you to extend the resource in the future, and to add meta-data such as a self-link which can be very useful in a REST-ful application.
Keep in mind that all event payloads must be directly representable as JSON, so we cannot just add properties to the `articles` array itself.


## Creating the article-search-box-widget

This is what the article-search-box-widget will look like:

![article-search-box-widget](img/article_search_box_widget.png)

The widget has a simple input field and a submit button, and allows the user to filter a list of articles.


### Implementing the Widget Features

The article-search-box-widget subscribes to a resource containing incoming *articles* and publishes a resource containing *filteredArticles* that match a user-specified term.
Accordingly, we require the configuration of two resource topics using the [widget descriptor](../../includes/widgets/shop-demo/article-search-box-widget/widget.json#L16-38).
If no filter term has been entered by the user, the incoming articles are simply passed through in their entirety.

To allow the user to manipulate the search term from the view, we have to [add it to the scope](../../includes/widgets/shop-demo/article-search-box-widget/article-search-box-widget.js#L15-17) of the AngularJS controller.

```javascript
$scope.model = {
   searchTerm: ''
};
```

This allows us to bind `$scope.model.searchTerm` to the input field in the [HTML template](../../includes/widgets/shop-demo/article-search-box-widget/default.theme/article-search-box-widget.html#L7).

Now, we store any incoming articles and invoke the `search` method whenever they have changed:

```javascript
eventBus.subscribe( 'didReplace.' + articlesResource, function( event ) {
   unfilteredArticles = event.data.entries || [];
   search();
} );
```

The [`search` method](../../includes/widgets/shop-demo/article-search-box-widget/article-search-box-widget.js#L34-54), which is also invoked whenever the _search_-button is activated, performs the actual filtering work:

```javascript
function search() {
   var newFilteredArticles = unfilteredArticles;
   var searchTerm = $scope.model.searchTerm;
   if( searchTerm ) {
      newFilteredArticles = unfilteredArticles.filter( function( article ) {
         return infixMatch( article.name, searchTerm ) ||
            infixMatch( article.id, searchTerm ) ||
            infixMatch( article.htmlDescription, searchTerm );
      } );
   }

   if( !ng.equals( newFilteredArticles, filteredArticles ) ) {
      filteredArticles = newFilteredArticles;
      eventBus.publish( 'didReplace.' + filterArticlesResource, {
         resource: filterArticlesResource,
         data: {
            entries: filteredArticles
         }
      } );
   }
}
```

The `search` method simply filters the article if a search term was specified and then checks if the result has changed since the last invocation.
If so, the new resource contents are published using a *didReplace* event under the resource topic configured for the  *filteredArticle* feature.
For the filtering itself, the [`infixMatch` helper](../../includes/widgets/shop-demo/article-search-box-widget/article-search-box-widget.js#L58-60) is used:

```javascript
function infixMatch( subject, query ) {
   return ( subject || '' ).toLowerCase().indexOf( query.toLowerCase() ) !== -1;
}
```


## Adding the Widget to the Page

Finally, we include the [article-search-box-widget](../../includes/widgets/shop-demo/article-search-box-widget) into our [shop_demo](../../application/pages/shop_demo.json#L16-28) page:

```javascript
"searchBox": [
   {
      "widget": "shop-demo/article-search-box-widget",
      "features": {
         "articles": {
            "resource": "articles"
         },
         "filteredArticles": {
            "resource": "filteredArticles"
         }
      }
   }
]
```


## The Next Step

Now the user can search for articles but the results are still not visible.
To change this, the next step is to implement the [article-browser-widget](05_article_browser_widget.md) which actually *displays* the matching articles.

[« Defining the Application Flow](03_application_flow.md) | The article-browser-widget | [The article-browser-widget »](05_article_browser_widget.md)
