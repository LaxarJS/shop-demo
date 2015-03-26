# ArticleBrowserWidget
In this step we implement the ArticleBrowserWidget which displays a list of articles to the user and allows to select one article for which another widget (next step) will show details.


## Creating the ArticleBrowserWidget
This is what the final ArticleBrowserWidget will look like:

![ArticleBrowserWidget](img/article_browser_widget.png)

It has a heading and a table with the list of articles.
The sixth article is selected here.

### The Features of the ArticleBrowserWidget

The widget configuration has two features: *display* (a list of articles) and *select* (an article).

#### Displaying a List of Articles
For the first feature [*display*](../../includes/widgets/shop_demo/article_browser_widget/widget.json#L20) we allow to configure the name of the resource with the articles and how the widget lists them.
It will get the list in a `didReplace` event with the name configured under the key `resource` from the ArticleSearchBoxWidget.
As we know that the widget would be useless without a list to render, we define the `resource` property as `required` in the specification of its parent object.
Using the format `topic` allows us to use the same set of allowed characters as for the `resource` feature of the ArticleSearchBoxWidget.

All properties prefixed with `html` are labels that are allowed to use html tags for display purposes that we'll later bind to in the widget html template.
Note that the `html` prefix is not mandatory but only a convention to easily determine whether a string may contain html markup or not.

The implementation of the controller for the feature *display* is simple.
We can use the function `patterns.resource.handlerFor( $scope ).registerResourceFromFeature( 'display' )` from the LaxarJS Patterns library.
It automatically handles replace and update events for the configured resource `features.display.resource` and updates the data of the resource either in the object `$scope.model` or if it exists in the object `$scope.resources`.
As we defined `$scope.resources` property in the ArticleBrowserWidget, the data can be found in the object `$scope.resources.display`.

We add `laxar` and `laxar_patterns` to the [define block](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js#L8) and add a handler for the resource to the [controller function](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js#L26):
```javascript
patterns.resources.handlerFor( $scope )
   .registerResourceFromFeature( 'display', { onUpdateReplace: checkArticles } );
```

We can configure the resource *display* for the widget when adding it to the application so that it subscribes to the relevant events.
We create a [HTML template](../../includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html) which actually references our model.
Either the list of articles is displayed in the table or a hint that there are no articles based on the received resource.

Basic widget style is implemented using a [CSS stylesheet](../../includes/widgets/shop_demo/article_browser_widget/default.theme/css/article_browser_widget.css), possibly generated from an [SCSS file](../../includes/widgets/shop_demo/article_browser_widget/default.theme/scss/article_browser_widget.scss).


### Article Selection by the User
Now we'll cover the second feature called *select* of the ArticleBrowserWidget.
This allows the configuration of the resource name of a selected article under which it is published on the EventBus.
In our application the ArticleTeaserWidget and the ShoppingCartWidget will listen for events of this resource.
These widgets we will implement in the next steps.

Add the property [`select`](../../includes/widgets/shop_demo/article_browser_widget/widget.json#L53) to the object `features`:

```json
"select": {
   "type": "object",
   "description": "Select an article.",
   "required": [ "resource" ],
   "properties": {
      "resource": {
         "type": "string",
         "description": "Name of the data resource with the selected article.",
         "format": "topic"
      }
   }
}
```
The feature *select* has a property `resource` which is required and has the type string.
We expect that the name under which the selected article is published as resource, is configured when including the widget to a application page.

In our [HTML template](../../includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html#L25) we use the directive `ngClick`:

```html
<td data-ng-click="selectArticle( article )">{{ article.details.id }}</td>
<td data-ng-click="selectArticle( article )">{{ article.details.name }}</td>
<td data-ng-click="selectArticle( article )" class="price">{{ article.details.price | currency : "€ " }}</td>
```

To give the user a visual feedback of the selected article we bind the CSS class `selected` with ngClass to the table rows.
```html
<tr class="selectable"
          data-ng-repeat="article in resources.display.entries track by article.id"
          data-ng-class="{selected: article.id == selectedArticle.id }" >
```

Now we implement the function [`$scope.selectArticle`](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js) which is invoked by ngClick.
It publishes the selected article on the EventBus:

```javascript
$scope.selectArticle = function( article ) {
   $scope.selectedArticle = article;
   var resourceName = $scope.features.select.resource;
   $scope.eventBus.publish( 'didReplace.' + resourceName, {
         resource: resourceName,
         data: article
      }, {
         deliverToSender: false
      }
   );
};
```
The third parameter which we assign to the `publish` function is optional.
The option `deliverToSender: false` implies that the EventBus doesn't deliver the event back to the ArticleBrowserWidget.

### Adding the ArticleSearchBoxWidget to our Application

We update the page [ShopDemo](../../application/pages/shop_demo.json#L39) and add the ArticleBrowserWidget to the `content1a`:
```json
{
  "widget": "shop_demo/article_browser_widget",
  "features": {
     "display": {
        "resource": "articles"
    },
     "select": {
        "resource": "selectedArticle"
     }
  }
}
```

Because of the page configuration the ArticleBrowserWidget expects the article list under the resource `articles` and the ArticleSearchBoxWidget publishes the article list under the [same name](../../application/pages/shop_demo.json#L29):

```json
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


The ArticleSearchBoxWidget fetches a list of articles from a database, in our case a PouchDB, and lets the user filter them with an input field.
If the database does not exist or has no articles the widget creates it and pushes the articles.
This procedure is for demo propose only.
The widget publishes the result list as resource `articles` on the EventBus and the ArticleBrowserWidget receives it.
The other resource `selected Article` is published by the ArticleBrowserWidget and will be used by a receiver which we will introduce in the next step.

![Step 5](img/step5.png)

We stop the server (`Ctrl-C`) and start it with `npm start` again.

The application should list 11 articles now and display a search box at the top of the site.



### Reset Selected Article
For now our ArticleBrowserWidget lets the user select an article from the list.
But in case the list is updated or replaced the widget doesn't check if the selected article is possibly missing in the list.
The widget needs to react to such a situation and reset the selection.
If the selected article is missing in the changed list the widget has to reset the selection internally and send the appropriate event for the `select` resource.

By implementing the function [`checkArticles`](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js#L45) we'll try to make these tests pass.
This functions uses the `laxar.object.path` function which returns the value of `$scope.resources.display.entries` if it exists or the alternative given as third parameter in case it doesn't exist.
So in our case we'll either receive an array of entries, something that is no array or an empty array.
The second case is caught by checking `entries.length`:

```javascript
var entries = ax.object.path( $scope.resources, 'display.entries', [] );
if( !entries.length ) {
   $scope.selectArticle( null );
   return;
}
```


## The Next Step
The next step is to implement the [ArticleTeaserWidget](06_article_teaser_widget.md) which displays the details of one article.

[« ArticleSearchBoxWidget](04_article_search_box_widget.md) | ArticleBrowserWidget | [ArticleTeaserWidget »](06_article_teaser_widget.md)
