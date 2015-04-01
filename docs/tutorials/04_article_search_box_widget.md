# The ArticleSearchBoxWidget

By this time, our application only displays a headline and does not allow for any user interaction.
To change this we implement the _ArticleSearchBoxWidget._
It provides a search box, allowing the user to filter articles by their name or description.
Our widget will use *events* to publish the list of articles matching a user's search term to other widgets.

After going through this chapter, you will be familiar with the event bus and how it is accessed by a widget.
It is recommended to have a look at the manual about [events and publish-subscribe](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md#events-and-publish-subscribe) first, to allow for a better understanding.


## Adding a Third-Party Library

The ArticleSearchBoxWidget and the _OrderActivity_ (which we will implement later) we would like to use [PouchDB](http://pouchdb.com/) to simulate a backend store.
To achieve this, we add PouchBD as a dependency to our application's [bower manifest](../../bower.json#L18):

```javascript
"dependencies": {
   ...,
   "pouchdb": "2.2.x"
}
```

A simple call to `./node_modules/bower/bin/bower install` should fetch the new dependency for us.

Adding PouchDB to the `paths` mapping of the [RequireJS configuration](../../require_config.js#L110) allows for simple access from our widgets' AMD modules:

```javascript
paths: {
   ...
   // PouchDB:
   'pouchdb': 'pouchdb/dist/pouchdb-nightly'
}
```


## Creating the ArticleSearchBoxWidget

This is how the ArticleSearchBoxWidget will look like:

![ArticleSearchBoxWidget](img/article_search_box_widget.png)

The widget has a simple input field and a submit button.


### Implementing the Widget Features

The ArticleSearchBoxWidget fetches a list of articles from a database, in our case provided by PouchDB, and lets the user filter them with an input field.
The widget publishes the result list as a resource on the EventBus for any subscriber (widget or activity) to receive it.

There are two use cases of the ArticleSearchBoxWidget in our application.
First the initial fetching of a list of articles when the user has entered the page and secondly the fetching and filtering of articles after the user has submitted a search.

To access the search term from the view we have to [provide it](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L23) on the AngularJS scope of the controller:

```javascript
$scope.model = {
   searchTerm: ''
};
```

In the [HTML template](../../includes/widgets/shop_demo/article_search_box_widget/default.theme/article_search_box_widget.html#L7) we bind the `$scope.model` to the input field.

For the first use case, the search term is an empty string.
Our [filterArticles](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L80) procedure does not filter anything if the search term is empty or is only one character.
In this case, all articles are returned.
To trigger the initial fetch when the user enters the site, the ArticleSearchBoxWidget [subscribes](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L29) to the `beginLifecycleRequest` event:

```javascript
$scope.eventBus.subscribe( 'beginLifecycleRequest', function() {
   $scope.search();
} );
```

The [`search` method](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L35) first fetches the articles, then filters them and finally publishes the result:

```javascript
$scope.search = function() {
   fetchArticles()
      .then( function( articles ) {
         return filterArticles( articles, $scope.model.searchTerm );
      } )
      .then( publishArticles, function( error ) {
         ax.log.debug( error );
      } );
};
```


The methods [`fetchArticles`](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L47) and [`filterArticles`](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L79) are for integration with PouchDB, and would be implemented differently for, say, a REST service.
After fetching the articles (either all of them or just the search results), the widget [publishes](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L97) them as a resource on the *event bus*:

```javascript
var resourceName = $scope.features.resource;
$scope.eventBus.publish( 'didReplace.' + resourceName, {
   resource: resourceName,
   data: { entries: articles }
} );
```

The method `$scope.eventBus.publish` expects three parameters: event name, the event payload and (if needed) additional options.
The _event name_ for this event consists of the event type (`didReplace`), a dot as a topic separator, and the resource name.
The _event payload_ has two properties in this case, namely the configured _name_ of the resource (`$scope.features.cart.resource`) and the search results as data (`$scope.resources.cart`).
Most of the time, the additional options are not required.

To ensure that the widget gets the name of the resource from the configuration on the page, like the HeadLineWidget gets the `htmlText` for the  headline, we create a corresponding [feature definition](../../includes/widgets/shop_demo/article_search_box_widget/widget.json#L17).
We mark the `resource` property as `required` in the specification of its parent object:

```javascript
"features": {
   // ...
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "ID of the resource under which the result is published.",
         "format": "topic"
      },
   // ...
   }
   // ...
}
```

The `resource` property is defined as a string using the `topic` format, which limits the set of allowed characters used to name it.
For the scope of this demo application it is sufficient to know, that simple camel case strings with lowercase first character are totally valid.

The second feature, [`database`](../../includes/widgets/shop_demo/article_search_box_widget/widget.json#L23), lets us configure an individual database ID to be used by the widget within this application.


## Adding the Widget to the Page

We include the [ArticleSearchBoxWidget](../../includes/widgets/shop_demo/article_search_box_widget) in our [shop_demo](../../application/pages/shop_demo.json) page:

```javascript
"searchBox": [
   {
      "widget": "shop_demo/article_search_box_widget",
      "features": {
         "resource": "articles",
         "database":{
            "pouchDb": {
               "dbId": "articles"
            }
         }
      }
   }
]
```


## The Next Step

Now we can search for articles but the results are still not visible.
To change this, the next step is to implement the [ArticleBrowserWidget](05_article_browser_widget.md) which displays the articles.

[« Defining the Application Flow](03_application_flow.md) | The ArticleBrowserWidget | [The ArticleBrowserWidget »](05_article_browser_widget.md)
