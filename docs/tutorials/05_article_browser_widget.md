# The article-browser-widget

In this step we are going to implement the _article-browser-widget_ which displays a list of articles to the user and allows to select an individual article.
Another widget (to be implemented in the next step) will show details on the currently selected article.
This part of the tutorial will allow you to learn how widgets safely share resources through the event bus, and how resources can be displayed to the user.


## Creating the article-browser-widget

This is what the final article-browser-widget will look like:

![article-browser-widget](img/article_browser_widget.png)

It has a heading and a table containing the list of articles.
In the image, the sixth row represents the currently selected article.


### The Features of the article-browser-widget

The widget configuration has two features: display a list of *articles* and allow *selection* of an article.


#### Displaying a List of Articles

For the first feature [*articles*](../../includes/widgets/shop-demo/article-browser-widget/widget.json#L16-27), we allow to configure the name of the resource containing the articles.

```json
"articles": {
   "type": "object",
   "description": "Display a list of articles.",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "Name of the data resource with articles.",
         "format": "topic"
      }
   }
}
```

Because the widget would be useless without a list of articles to render, we define the `resource` property as `required` in the feature schema.
The implementation of the [controller](../../includes/widgets/shop-demo/article-browser-widget/article-browser-widget.js#L18-22) for the feature *articles* is simple:

```javascript
var articlesResource = $scope.features.articles.resource;
eventBus.subscribe( 'didReplace.' + articlesResource, function( event ) {
   $scope.resources.articles = event.data;
   $scope.selectArticle( null );
} );
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
