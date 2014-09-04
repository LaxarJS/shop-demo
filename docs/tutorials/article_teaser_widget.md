# ArticleTeaserWidget
The ArticleTeaserWidget has two tasks: Display the details of the selected article and let the user add the article to cart. Last chapter  we implemented the ArticleBrowserWidget which publishes the selected article as a resource on the EventBus. The ArticleTeaserWidget will listen to the events about this resource. It displays the details of the article and an *add ot cart* button. If the user presses the button the widget publishes a signal for the ShoppingCartWidget to add the selected article to cart.  

## Integration in the Application
![Step 2](img/step2.png)  

## Appearance
![ArticleTeaserWidget](img/article_teaser_widget.png)  

## Create the Base Files
Like we did for the ArticleBrowserWidget we execute the the script ```laxar-widget``` to accelerate the process of developing.
If still running we stop the server (Ctrl-C).

```
mkdir -p includes/widgets/shop_demo/article_teaser_widget
cd includes/widgets/shop_demo/article_teaser_widget
grunt-init laxar-widget
```

We start the server with ```npm start``` again.
```
cd -
npm start
```

## Display Article
The first requirement is that it is possible to configure a resource resembling an article. We assume that this resource will be published by another widget or activity on the EventBus. The resource will have information about an article. In our ShopDemo app it will be the article selected by the user.

This feature with its tests and implementation is simular to the **display** feature of the ArticleBrowserWidget.

Two test to proof the handling with the resource (subscribes for the events):
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/spec/article_teaser_widget_spec.js:](../../includes/widgets/shop_demo/article_teaser_widget/spec/article_teaser_widget_spec.js)

We need some dummy data for the test and create a file like we did for the ArticleBrowserWidget:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/spec/spec_data.json](../../includes/widgets/shop_demo/article_teaser_widget/spec/spec_data.json)

We add the feature *display* to the widget.json:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/widget.json:](../../includes/widgets/shop_demo/article_teaser_widget/widget.json)

For the first feature we add the headline and the division with the definition list:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html)

We add a laxar-patterns resource handler to the controller:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js](../../includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js#L24)  

For the style of the widget copy the [shop_demo/includes/widgets/shop_demo/article_teaser_widget/default.theme/css/article_teaser_widget.css](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/css/article_teaser_widget.css) and if you are interested in the sass file take a look [here](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/scss/article_teaser_widget.scss).

## Add article to cart
The second requirement is that the user can add the diplayed article to cart. For this feature we add a button which triggers a takeActionRequest event on the EventBus. The ArticleTeaserWidget doesn't add the article to the cart directly. It just triggers a configured action. In our application we name the action ```addArticle``` and the ShoppingCartWidget adds the article to cart when the takeActionRequest event is published. It is possible to use the ArticleTeaserWidget for an other application such as an article administration tool where the details of one article are shown and the button doesn't trigger to add it to cart but to delete it from the shop instead. Of course in this application there wouldn't be a ShoppingCartWidget but a kind of DeleteArticleActivity.

### Test
We need to test if the widget triggers the ```takeActionRequest.<action>``` when the user presses the button.

[shop_demo/includes/widgets/shop_demo/article_teaser_widget/spec/article_teaser_widget_spec.js:](../../includes/widgets/shop_demo/article_teaser_widget/spec/article_teaser_widget_spec.js#L106)
```javascript
describe( 'with feature button and user adds an article to cart', function() {

   beforeEach( function() {
      setup( configuration );
      testBed.eventBusMock.publish( 'didReplace.article', {
         resource: 'article',
         data: resourceData
      } );
      jasmine.Clock.tick( 0 );
      $( 'button' ).trigger( 'click' );
   } );

   it( 'publishes a takeActionRequest to add the selected article to cart', function() {
      expect( testBed.scope.eventBus.publish )
         .toHaveBeenCalledWith( 'takeActionRequest.addArticle', {
            action: 'addArticle'
         }
      );
   } );
} );
```

Add the property ```button``` to the configuration in line 21.
```javascript
var configuration = {
   display: {
      resource: 'article'
   },
   button: {
      htmlLabel: 'Add to Cart',
      action: 'addArticle'
   }
};
```

### Implement the Feature
To implement the feature **button** we have to do three things. First we add the function ```$scope.addToCart``` to the controller. Secondly we extend the HTML template with a button and bind the function ```$scope.addToCart```to its click event. Thirdly we have to edit the widget.json and add the ```button``` to the features object.
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js](../../includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget.js#L26)  

```javascript
$scope.addToCart = function() {
   var actionName = $scope.features.button.action;
   $scope.eventBus.publish( 'takeActionRequest.' + actionName, {
      action: actionName
   } );
};
```

We add the button element to our template:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html](../../includes/widgets/shop_demo/article_teaser_widget/default.theme/article_teaser_widget.html#L25)

We add the feature **button** to the widget.json:
[shop_demo/includes/widgets/shop_demo/article_teaser_widget/widget.json](../../includes/widgets/shop_demo/article_teaser_widget/widget.json#L58)


## Add the Widget to Application
We add the widget to the ```content1b``` section of our first page. We configure only the required features. For the labels we use the default values. For example the ```features.display.htmlPriceLabel``` has the value ```"Price"```. 

**shop_demo/application/pages/shop_demo.json:**
```json
"content1b": [
   {
      "widget": "shop_demo/article_teaser_widget",
      "features": {
         "display": {
            "resource": "selectedArticle"
         },
         "button": {
            "htmlLabel": "<i class='fa fa-shopping-cart'></i> Add to Cart",
            "action": "addArticle"
         }
      }
   }
],
```

Stop the server and start it with ```npm start``` again.

## Next Step
Our app has an *add to cart* button in the article details division now. When pressing it nothing visible happens. The [ShoppingCartWidget](shopping_cart_widget.md)  is missing.  


[<< ArticleBrowserWidget](article_browser_widget.md)   | ArticleTeaserWidget | [ShoppingCartWidget >>](shopping_cart_widget.md) 

