# ArticleBrowserWidget and ArticleSearchBoxWidget
By this time the ShopDemo only displays a headline and allows no user interaction.
To change this we extend the ArticleBrowserWidget to display a list of articles and allow the selection of one article.
In our example application the selected article will be displayed in detail by the ArticleTeaserWidget and the list of articles is received from the ArticleSearchBoxWidget, which will both be introduced in later.

## Integration into the Application
![Step 1](img/step1.png)

## Appearance
![ArticleBrowserWidget](img/article_browser_widget.png)

## Features of the ArticleBrowserWidget
This widget has two features: **display** (a list of articles) and **select** (an article).

### Display a List of Articles
The first feature **display** describes how the widget receives and lists the articles.
It will eventually get the list in a `didReplace` event from another widget or activity with the name configured under the key `resource`.
The complete contents of the file can be seen [here](../../includes/widgets/shop_demo/article_browser_widget/widget.json).
For the following first part of tests and widget implementation only the lines 20 to 51 are relevant.
The `resource` property is defined as a string using the `topic` format, which limits the set of allowed characters used to name it.
For the scope of this demo application it is sufficient to know, that simple camel case strings with lowercase first character are totally valid.
As we know that the widget would be useless without a list to render, we define the `resource` property as `required` in the specification of its parent object.

All properties prefixed with `html` are labels that are allowed to use html tags for display purposes that we'll later bind to in the widget html template.
Note that the `html` prefix is not mandatory but only a convention to easily determine whether a string may contain html markup or not.

Now lets start by writing spec tests for the `display` feature.

#### Write Spec Tests
If not still running, we start the server with `npm start` in the root directory of the app.
```shell
npm start
```

We can then open the jasmine spec test runner of the ArticleBrowserWidget using the following url:
[http://localhost:8000/includes/widgets/shop_demo/article_browser_widget/spec/spec_runner.html](http://localhost:8000/includes/widgets/shop_demo/article_browser_widget/spec/spec_runner.html)

For now there will only be one passing test, namely "A ArticleBrowserWidget still needs some tests".
Its obvious that this only represents a dummy tests and that it's our task to implement the real tests.

In preparation for the tests copy the first 50 lines from the final ShopDemo to the spec js file:
[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js)

Change the object `configuration` (line 21) to only provide a value for the `resource` property of the `display` feature (we'll add the rest again later):
```javascript
var configuration = {
   display: {
      resource: 'articles'
   }
};
```

The first requirement for the widget is that it is possible to configure a data resource.
We assume that this resource will be published as a collection of articles by another widget or activity on the EventBus.
Hence we implement a test for the expected communication of the widget.
As the widget is only a consumer of the collection resource (we call this type of collaborator a **slave**), it has to subscribe to `didReplace` and `didUpdate` events of the resource.

Create a jasmine describe block with a `beforeEach` and an `it` block.
We add two expectations to the it function.

[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L66)
```javascript
expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith( 'didReplace.articles', anyFunction );
expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith( 'didUpdate.articles', anyFunction );
```

To test if the widget reflects the data of the events in its internal model we add the expectation `expect( testBed.scope.resources.display ).toEqual( resourceData );`.
We exercise the test by publishing an exemplary resource in the `beforeEach` function and trigger asynchronous queue processing of the EventBus by ticking the jasmine clock mock:

```javascript
testBed.eventBusMock.publish( 'didReplace.articles', {
   resource: 'articles',
   data: resourceData
} );
jasmine.Clock.tick( 0 );
```
Additionally the `beforeEach` block invokes a setup function encapsulating the setup of the LaxarJS widget testbed and configuration of the features we defined earlier.
With the previous steps it should be like this:
[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L54)

In order to keep the test file small and limited to the test cases, we put the exemplary data used in the tests into a separate file.
For further testing the ArticleBrowserWidget we put a list of several articles into that file.

[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/spec_data.json](../../includes/widgets/shop_demo/article_browser_widget/spec/spec_data.json)


To test whether the widget reflects updates of the resource we add another describe block inside the previous one:

```javascript
         describe( 'and an update of the articles resource', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'didUpdate.articles', {
                  resource: 'articles',
                  patches: [
                     {
                        op: 'replace',
                        path: '/entries/1/details/price',
                        value: 19.99
                     }
                  ]
               } );
               jasmine.Clock.tick( 0 );
            } );
           
            it( 'reflects updates to the published resource', function() {
               expect( testBed.scope.resources.display.entries[ 1 ].details.price ).toEqual( 19.99 );
            } );

         } );
```

The `beforeEach` function publishes an update for the article list and the function in the `it` block proofs whether the widget reflects this update in the widget's model.
Note that within our application context we assume that the actual array with articles is located under the key `entries` within the resource.
This is because we assume that in a real world scenario the resource is fetched from a RESTful service and thus needs to have more properties (like selflink) than the actual collection items.

Both tests should be failing as we didn't touch the implementation of the widget controller yet.

#### Implement Feature Display
The implementation of the controller for the feature display is simple.
We can use the function `patterns.resource.handlerFor( $scope ).registerResourceFromFeature( 'display' )` from the LaxarJS Patterns library.
It automatically handles replace and update events for the configured resource `features.display.resource` and updates the data of the resource either in the object `$scope.model` or if it exists in the object `$scope.resources`.
As we defined `$scope.resources` property in the ArticleBrowserWidget, the data can be found in the object `$scope.resources.display`.

We add `laxar_patterns` to the define block and add a handler for the resource to the controller function:
[shop_demo/includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js:](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js)
```javascript
define( [
   'angular',
   'laxar_patterns'
], function( ng, patterns ) {
   'use strict';

   var moduleName = 'widgets.shopping_cart.article_browser_widget';
   var module     = ng.module( moduleName, [] );

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {
      $scope.resources = {};
      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'display' );
   }

   module.controller( moduleName + '.Controller', Controller );
 
   return module;

} );
```

The spec tests should be passing, as everything we tested up to now is handled by LaxarJS Patterns.

We can configure the resource **display** for the widget when adding it to the application so that it subscribes to the relevant events.
But so far the widget only displays a headline and no articles, which means we have to extend the HTML template to actually reference our model.

[shop_demo/includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html:](../../includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html)

```html
<h3 data-ng-class="{ 'app-articles': resources.display.entries.length }">
   <i class='fa fa-gift'></i> {{ features.display.headline }}
</h3>
<table class="table table-hover table-striped"
       data-ng-class="{ 'app-articles': resources.display.entries.length }">
   <colgroup>
      <col class="app-col-1">
      <col class="app-col-2">
      <col class="app-col-3">
   </colgroup>
   <thead>
      <tr data-ng-if="!resources.display.entries.length">
         <th class="app-no-articles" colspan="3">No articles</th>
      </tr>
      <tr data-ng-if="resources.display.entries.length">
         <th data-ng-bind-html="features.display.htmlIdLabel"></th>
         <th data-ng-bind-html="features.display.htmlNameLabel"></th>
         <th class="price" data-ng-bind-html="features.display.htmlPriceLabel"></th>
      </tr>
   </thead>
   <tbody>
      <tr class="selectable"
          data-ng-repeat="article in resources.display.entries track by article.id"
          data-ng-class="{selected: article.id == selectedArticle.id }" >
         <td data-ng-click="selectArticle( article )">{{ article.details.id }}</td>
         <td data-ng-click="selectArticle( article )">{{ article.details.name }}</td>
         <td class="price"
             data-ng-click="selectArticle( article )">{{ article.details.price | currency : "€ " }}</td>
      </tr>
      <tr class="app-no-articles"
          data-ng-if="!resources.display.entries.length">
         <td colspan="5">&nbsp;</td>
      </tr>
   </tbody>
</table>
```
Here we not only added the listing of the articles itself but also change the output based on the emptiness of the resource's entries array.

For the style of the widget copy the [shop_demo/includes/widgets/shop_demo/article_browser_widget/default.theme/css/article_browser_widget.css](../../includes/widgets/shop_demo/article_browser_widget/default.theme/css/article_browser_widget.css) and if you are interested in the sass file take a look [here](../../includes/widgets/shop_demo/article_browser_widget/default.theme/scss/article_browser_widget.scss). 

#### Change the Page
We update `application/pages/shop_demo.json` and add the property `display.resource` to the feature configuration.
```json
         {
            "widget": "shop_demo/article_browser_widget",
            "features": {
               "display": {
                  "resource": "articles"
               }
            }
         }
```

Our application gives us the hint that there are no articles yet.
[http://localhost:8000/debug.html](http://localhost:8000/debug.html)

### Add ArticleSearchBoxWidget to the App
To get some articles we add the ArticleSearchBoxWidget to our application.
It fetches a list of articles from a database and lets the user filter them with an input field.
For our demo application we use [PouchDB](http://pouchdb.com/) as a backend store and thus need to add it as dependency to bower now.

[shop_demo/bower.json](../../bower.json#L13)
```javascript
"pouchdb": "2.2.x"
```
A simple call to `./node_modules/bower/bin/bower install` should fetch the new dependency for us.

Adding it to the `paths` mapping the `require_config.js` simplifies usage within our AMD define method a lot:

[shop_demo/require_config.js](../../require_config.js#L110)
```javascript
// PouchDB:
'pouchdb': 'pouchdb/dist/pouchdb-nightly',
```

#### Appearance
![ArticleSearchBoxWidget](img/article_search_box_widget.png)

For simplicity we don't cover the implementation of the ArticleSearchBoxWidget during this tutorial but just copy it from the github repository:
[../../includes/widgets/shop_demo/article_search_box_widget](../../includes/widgets/shop_demo/article_search_box_widget)

And include it in our page `application/pages/shop_demo.json`:
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

We stop the server (`Ctrl-C`) and start it with `npm start` again.

The ArticleBrowserWidget should list 11 articles now and display a search box at the top of the site.
[http://localhost:8000/debug.html](http://localhost:8000/debug.html)


### Let the User Select an Article
Now we'll cover the second feature called **select** of the ArticleBrowserWidget.
This allows the configuration of the resource name of a selected article under which it is published on the EventBus.
In our application the ArticleTeaserWidget and the ShoppingCartWidget will listen for events of this resource.

We need to test if the widget publishes the selected resource when a user selects an article.
We therefore implement a UI Test and simulate a user click on a table row with an article.
[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L104)

We expect that the widget recognizes the click and publishes the corresponding article as selected article.
To fix the failing test we have to implement the feature in our controller, template and the widget.json.  

Add the property `select` to the object `features`.
The feature **select** has a property `resource` which is required and has the type string.
Using the format `topic` again allows us to use the same set of allowed characters as for the `display.resource` property.

**shop_demo/includes/widgets/shop_demo/article_browser_widget/widget.json:**
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

In our HTML template we will use the directive `ngClick`. We add it to the table cells with article id, name and price.

```html 
<td data-ng-click="selectArticle( article )">{{ article.details.id }}</td>
<td data-ng-click="selectArticle( article )">{{ article.details.name }}</td>
<td data-ng-click="selectArticle( article )" class="price">{{ article.details.price | currency : "€ " }}</td>
```

To give the user a visual feedback of the selected article we bind ngClass to the table rows.
```html
<tr class="selectable"
          data-ng-repeat="article in resources.display.entries track by article.id"
          data-ng-class="{selected: article.id == selectedArticle.id }" >
```

The final template can be seen here:
[shop_demo/includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html](../../includes/widgets/shop_demo/article_browser_widget/default.theme/article_browser_widget.html)

Now we implement the function `$scope.selectArticle` which is invoked by ngClick.

**shop_demo/includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js:**
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
The test should pass and we add the feature select to the configuration of the ArticleBrowserWidget in the page.

**application/pages/shop_demo.json**
```json
{
  "widget": "shop_demo/article_browser_widget",
  "features": {
     "display": {
        "resource": "articles"
    },
     "select": {
        "resource": "selectedArticle",
        "action": "addArticle"
     }
  }
}
```

#### Reset Selected Article
For now our widget lets the user select an article from the list.
But in case the list is updated or replaced the widget doesn't check if the selected article is possibly missing in the list.
The widget needs to react to such a situation and reset the selection
If the selected article is missing in the changed list the widget has to reset the selection internally and send the appropriate event for the `select` resource.

Hence we add some tests to enforce that expectation.
[shop_demo/includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L134)  

In addition to the simulation of a simple `didUpdate` event removing the selected article from the list, we also added some tests for different kinds of `didReplace` events that invalidate the current selection.
By implementing the function `checkArticles` we'll try to make these tests pass.
This functions uses the `laxar.object.path` function which returns the value of `$scope.resources.display.entries` if it exists or the alternative given as third parameter in case it doesn't exist.
So in our case we'll either receive an array of entries, something that is no array ar all or an empty array.
The second case it caught by checking `entries.length`.

```javascript
var entries = ax.object.path( $scope.resources, 'display.entries', [] );
if( !entries.length ) {
   $scope.selectArticle( null );
   return;
}
```
[shop_demo/includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js](../../includes/widgets/shop_demo/article_browser_widget/article_browser_widget.js#L45)  

## Next Step
The next step is to implement the [ArticleTeaserWidget](article_teaser_widget.md) which displays the details of one article.  
  
[<< ShopDemo](shop_demo.md)  | ArticleBrowserWidget | [ArticleTeaserWidget >>](article_teaser_widget.md)  

