define( [
   'laxar-developer-tools-widget/ax-developer-tools-widget',
   'laxar-application/includes/widgets/shop-demo/article-browser-widget/article-browser-widget',
   'laxar-application/includes/widgets/shop-demo/article-search-box-widget/article-search-box-widget',
   'laxar-application/includes/widgets/shop-demo/dummy-articles-activity/dummy-articles-activity',
   'laxar-application/includes/widgets/shop-demo/headline-widget/headline-widget',
   'laxar-application/includes/widgets/shop-demo/shopping-cart-widget/shopping-cart-widget',
   'laxar-application/includes/widgets/shop-demo/article-teaser-widget/article-teaser-widget'
], function() {
   'use strict';

   var modules = [].slice.call( arguments );
   return {
      'angular': modules.slice( 0, 6 ),
      'react': modules.slice( 6, 7 )
   };
} );
