# ArticleSearchBoxWidget
By this time the ShopDemo only displays a headline and does not allow for user interaction.
To change this we implement the ArticleSearchBoxWidget.
It provides a search box, allowing the user to find articles by their name or description.
Our widget will use *events* to transfer the resource with the list of articles matching a user's search term to other widgets.

For the following steps is it recommend to read the manual about the [widget communication](../missing_doc.md) first.


## Adding third party library
For our ArticleSearchBoxWidget and the OrderActivity, which we will implement later, we use [PouchDB](http://pouchdb.com/) as a backend store and thus we need to add it as dependency to our bower [config](../../bower.json#L13) now:

```javascript
"pouchdb": "2.2.x"
```
A simple call to `./node_modules/bower/bin/bower install` should fetch the new dependency for us.

Adding it to the `paths` mapping the [`require_config.js`](../../require_config.js#L110) simplifies usage within our AMD define method a lot:

```javascript
// PouchDB:
'pouchdb': 'pouchdb/dist/pouchdb-nightly',
```


## Creating the ArticleSearchBoxWidget
This is how the ArticleSearchBoxWidget looks like:

![ArticleSearchBoxWidget](img/article_search_box_widget.png)

The widget has a simple input field and a submit button.

### Implementing the Features
The ArticleSearchBoxWidget fetches a list of articles from a database, in our case a PouchDB, and lets the user filter them with an input field.
The widget publishes the result list as resource on the EventBus and any subscribed widget or activity receives it.

There are two use cases of the ArticleSearchBoxWidget in our application.
First the initial fetching of a list of articles when the user entered the page and secondly the fetching and filtering of articles when the user submitted a search.


To have access to the search term from the view we have to [define a object](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L23) in the scope:
```javascript
$scope.model = {
   searchTerm: ''
};
```
In the [HTML template](../../includes/widgets/shop_demo/article_search_box_widget/default.theme/article_search_box_widget.html#L7) we bind the `$scope.model` to the input field.

For the first use case the search term is an empty string.
Our [filterArticles](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L80) function does not filter anything if the search term is empty or is only one character.
All articles are returned.

To trigger the fetch at the beginning when the user enters the site, the ArticleSearchBoxWidget [subscribes](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L29) to the `beginLifecycleRequest` event:
```javascript
$scope.eventBus.subscribe( 'beginLifecycleRequest', function() {
   $scope.search();
} );
```

The [`search`](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L35) function first fetches the articles, then filters them and finally publishes the result:
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


The [`fetchArticles`](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L47) function and the [`filterArticles`](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L79) function are design specially for this demo project with PouchDB instead of a real backend.

After fetching the articles, either all articles or some filtered with a search term, the widget [publishes](../../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget.js#L97) them as data resource on the *EventBus*.
```javascript
var resourceName = $scope.features.resource;
$scope.eventBus.publish( 'didReplace.' + resourceName, {
   resource: resourceName,
   data: { entries: articles }
} );
```

The `$scope.eventBus.publish` function expects the three parameters: event name, the event object and additional options.
The event name consists of the event type (`didReplace`), a dot as separator and the resource name.
The event object has two properties the configured name of the resource (`$scope.features.cart.resource`) and the cart as data (`$scope.resources.cart`).
In this case we do not assign additional options.

To ensure that the widget gets the name of the resource from the configuration on the page, like the HeadLineWidget gets the `htmlText` for the  headline, we create a accordant feature [`definition`](../../includes/widgets/shop_demo/article_search_box_widget/widget.json#L17).
We define the `resource` property as `required` in the specification of its parent object:
:
```json
"features": {
...
"required": [ "resource" ],
"properties": {
   "resource": {
      "type": "string",
      "description": "ID of the resource under which the result is published.",
      "format": "topic"
   },
...
}
```

The `resource` property is defined as a string using the `topic` format, which limits the set of allowed characters used to name it.
For the scope of this demo application it is sufficient to know, that simple camel case strings with lowercase first character are totally valid.

The other feature [`database`](../../includes/widgets/shop_demo/article_search_box_widget/widget.json#L26) lets us configured an individual database id when adding the widget to our application.


## Adding the Widget to Page
We include the [ArticleSearchBoxWidget](../../includes/widgets/shop_demo/article_search_box_widget) in our page [`shopDemo`](../../application/pages/shop_demo.json):

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
At the moment we can search for articles but they are not displayed.
To change this the next step is to implement the [ArticleBrowserWidget](05_article_browser_widget.md) which displays the articles.

[<< Application Flow](03_application_flow.md) | ArticleBrowserWidget | [ArticleBrowserWidget >>](05_article_browser_widget.md)
