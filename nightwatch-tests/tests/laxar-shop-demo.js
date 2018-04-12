'use strict';

const dpro = require( 'dpro' );
const Test = require( '../lib/base-test-class' );

module.exports = new Test( {
   'laxar-shop-demo'( browser ) {
      let test = browser.page[ 'shop_demo' ]();
      test.navigate();
      test
         .waitForElementVisible( 'body' )
         .verify.title( 'LaxarJS ShopDemo' )
         .waitForElementVisible( '@container' )
         .waitForElementVisible( '@appHeader' )
         .waitForElementVisible( '@appContent' )
         .waitForElementVisible( '@articleBrowserWidget' )
         .waitForElementVisible( '@tableTableHoverTableStripedAppArticles' )
         .waitForElementVisible( '@articleTeaserWidget' )
         .waitForElementVisible( '@shoppingCartWidget' )
         .waitForElementVisible( getArticleFromTableRow( 3 ) )
         .click( getArticleFromTableRow( 3 ) )
         .waitForElementVisible( '@appTeaserImage' );
      test.expect.element( '@appTeaserImage' ).to.have.attribute( 'src' ).which.contains(
         dpro.urls.imageRow3
      );
      test
         .click( getArticleFromTableRow( 2 ) )
         .click( '@addToCartButton' )
         .verify.containsText('@cartRow1Price', dpro.prices.cartRow1Price )
         .click( '@addToCartButton' )
         .click( getArticleFromTableRow( 5 ) )
         .click( '@addToCartButton' )
         .waitForElementVisible( '@cartRow1' )
         .waitForElementVisible( '@cartRow2' )
         .verify.containsText( '@cartRow2Price', dpro.prices.cartRow2Price )
         .verify.containsText( '@cartSubtotal', dpro.prices.maxSubtotal )
         .click( '@secondItemPlus' )
         .click( '@secondItemMinus' )
         .click( '@secondItemMinus' )
         .click( '@firstItemPlus' )
         .click( '@firstItemMinus' )
         .click( '@firstItemMinus' )
         .verify.containsText( '@cartSubtotal', dpro.prices.endSubtotal )
         .click( '@orderButton' );

      test = browser.page[ 'finish_order' ]();
      test
         .waitForElementVisible( '@order' )
         .verify.containsText( '@order', dpro.order.text )
         .waitForElementVisible( '@continueShopping' )
         .click( '@continueShopping' );

      test = browser.page[ 'shop_demo' ]();
      test
         .waitForElementVisible( 'body' )
         .verify.title( 'LaxarJS ShopDemo' )
         .waitForElementVisible( '@container' )
         .waitForElementVisible( '@appHeader' )
         .waitForElementVisible( '@appContent' )
         .waitForElementVisible( '@articleBrowserWidget' )
         .waitForElementVisible( '@tableTableHoverTableStripedAppArticles' )
         .waitForElementVisible( '@articleTeaserWidget' )
         .waitForElementVisible( '@shoppingCartWidget' );
   }
} );

function getArticleFromTableRow( row ) {
   // must click table *cell* because of firefox:
   // https://bugzilla.mozilla.org/show_bug.cgi?id=1413493
   return '.article-browser-widget > div > table > tbody > tr:nth-child( ' + row + ' ) > td:nth-child(1)';
}
