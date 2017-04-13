'use strict';

module.exports = {
   url: 'http://localhost:8080/index.html#/browse/',
   elements: {
      container: {
         selector: 'body > div > div.container'
      },
      appHeader: {
         selector: 'body > div > div.container > header'
      },
      appContent: {
         selector: 'body > div > div.container > div > div'
      },
      articleBrowserWidget: {
         selector: '#ax-articleBrowserWidget-id2'
      },
      tableTableHoverTableStripedAppArticles: {
         selector: '#ax-articleBrowserWidget-id2 > div > table'
      },
      articleTeaserWidget: {
         selector: '#ax-articleTeaserWidget-id3'
      },
      shoppingCartWidget: {
         selector: '#ax-shoppingCartWidget-id4'
      },
      appTeaserImage: {
         selector: `#ax-articleTeaserWidget-id3 > div >
            div.app-teaser-wrapper.clearfix.app-selection > div:nth-child(2) > div > img`
      },
      addToCartButton: {
         selector: '#ax-articleTeaserWidget-id3 > div > div:nth-child(3) > button'
      },
      cart: {
         selector: '#ax-shoppingCartWidget-id4 > div > table'
      },
      cartRow1: {
         selector: '#ax-shoppingCartWidget-id4 > div > table > tbody > tr:nth-child( 1 )'
      },
      cartRow2: {
         selector: '#ax-shoppingCartWidget-id4 > div > table > tbody > tr:nth-child( 2 )'
      },
      cartRow1Price: {
         selector: '#ax-shoppingCartWidget-id4 > div > table > tbody > tr > td:nth-child( 3 )'
      },
      cartRow2Price: {
         selector: '#ax-shoppingCartWidget-id4 > div >table > tbody > tr:nth-child( 2 ) > td:nth-child( 3 )'
      },
      cartSubtotal: {
         selector: '#ax-shoppingCartWidget-id4 > div > table > tfoot > tr > td:nth-child( 3 )'
      },
      secondItemMinus: {
         selector: `#ax-shoppingCartWidget-id4 > div > table > tbody >
            tr:nth-child(2) > td.app-increase-buttons > button:nth-child(2)`
      },
      secondItemPlus: {
         selector: `#ax-shoppingCartWidget-id4 > div >table > tbody > tr:nth-child(2) >
            td.app-increase-buttons > button:nth-child(1)`
      },
      firstItemMinus: {
         selector: `#ax-shoppingCartWidget-id4 > div >table > tbody > tr:nth-child(1) >
            td.app-increase-buttons > button:nth-child(2)`
      },
      firstItemPlus: {
         selector: `#ax-shoppingCartWidget-id4 > div >table > tbody > tr:nth-child(1) >
            td.app-increase-buttons > button:nth-child(1)`
      },
      orderButton: {
         selector: '#ax-shoppingCartWidget-id4 > div > div > button'
      }
   }
};
