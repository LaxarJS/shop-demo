define( [
   '../includes/widgets/shop_demo/order_activity/order_activity',
   '../includes/widgets/shop_demo/article_search_box_widget/article_search_box_widget',
   '../includes/widgets/shop_demo/headline_widget/headline_widget',
   '../includes/widgets/shop_demo/article_browser_widget/article_browser_widget',
   '../includes/widgets/shop_demo/article_teaser_widget/article_teaser_widget',
   '../includes/widgets/shop_demo/shopping_cart_widget/shopping_cart_widget'
], function() {
   'use strict';

   return [].map.call( arguments, function( module ) { return module.name; } );
} );
