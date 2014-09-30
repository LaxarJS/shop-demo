Erklären wie wir Tests nutzen, TDD
Fürs Tutorial aber nicht notwendig zu verstehen. Dieses Kapitel sollte optional sein. Keine Konzepte erklären die über das Testen hinausgehen.

##### Writing Spec Tests
If not still running, we start the server with `npm start` in the root directory of the app.

We can then open the jasmine spec test runner of the ArticleBrowserWidget using the following url (maybe conform the port):
[http://localhost:8000/includes/widgets/shop_demo/article_browser_widget/spec/spec_runner.html](http://localhost:8000/includes/widgets/shop_demo/article_browser_widget/spec/spec_runner.html)

For now there will only be one passing test, namely "A ArticleBrowserWidget still needs some tests".
Its obvious that this only represents a dummy tests and that it's our task to implement the real tests.

With the spec tests we test a widget in isolation of the rest of the application. This helps to develop large apps and keep track of the side effect of changes of one artifact.

The first requirement for the widget is that it is possible to configure a data resource.
We assume that this resource will be published as a collection of articles by another widget or activity on the EventBus.
With the first fifty lines of the [spec js file](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js) we create the setup for our tests.
For testing the feature `display` the object `configuration` only needs the property `display`.
The property `select` is for further steps.

To test the communication of the widget with other widgets or activities we implement two tests.
As the widget is only a consumer of the collection resource (we call this type of collaborator a *slave*), it has to subscribe to `didReplace` and `didUpdate` events of the resource.

Create a jasmine describe block with a `beforeEach` and an `it` block.
We add two expectations to the [it function:](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L66)
```javascript
expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith( 'didReplace.articles', anyFunction );
expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith( 'didUpdate.articles', anyFunction );
```

To test if the widget reflects the data of the events in its internal model we add the expectation `expect( testBed.scope.resources.display ).toEqual( resourceData );`.
We exercise the test by publishing an exemplary resource in the [`beforeEach` function](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L54) and trigger asynchronous queue processing of the EventBus by ticking the jasmine clock mock:

```javascript
testBed.eventBusMock.publish( 'didReplace.articles', {
   resource: 'articles',
   data: resourceData
} );
jasmine.Clock.tick( 0 );
```

The function `testBed.eventBusMock.publish` expects the event name, the event object and additional options.
The event name consists of the event type (`didReplace`), a dot as separator and the resource name (`articles` the value of `configuration.display.resource`).
The event object has two properties the configured name of the resource (`$scope.features.cart.resource`) and the cart as data (`$scope.resources.cart`).
The option `deliverToSender: false` implies that the EventBus doesn't deliver the event back to the ShoppingCartWidget.

Additionally the `beforeEach` block invokes a setup function encapsulating the setup of the LaxarJS widget testbed and configuration of the features we defined earlier.

In order to keep the test file small and limited to the test cases, we put the exemplary data used in the tests into a separate file.
For further testing the ArticleBrowserWidget we put a list of several articles into [that file](../../includes/widgets/shop_demo/article_browser_widget/spec/spec_data.json).

To test whether the widget reflects updates of the resource we add another [describe block](../../includes/widgets/shop_demo/article_browser_widget/spec/article_browser_widget_spec.js#L75)  inside the previous one:

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