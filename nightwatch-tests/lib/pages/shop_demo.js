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
         selector: '.article-browser-widget'
      },
      tableTableHoverTableStripedAppArticles: {
         selector: '.article-browser-widget > div > table'
      },
      articleTeaserWidget: {
         selector: '.article-teaser-widget'
      },
      shoppingCartWidget: {
         selector: '.shopping-cart-widget'
      },
      appTeaserImage: {
         selector: `.article-teaser-widget > div >
            div.app-teaser-wrapper.clearfix.app-selection > div:nth-child(2) > div > img`
      },
      addToCartButton: {
         selector: '.article-teaser-widget > div > div:nth-child(3) > button'
      },
      cart: {
         selector: '.shopping-cart-widget > div > table'
      },
      cartRow1: {
         selector: '.shopping-cart-widget > div > table > tbody > tr:nth-child( 1 )'
      },
      cartRow2: {
         selector: '.shopping-cart-widget > div > table > tbody > tr:nth-child( 2 )'
      },
      cartRow1Price: {
         selector: '.shopping-cart-widget > div > table > tbody > tr > td:nth-child( 3 )'
      },
      cartRow2Price: {
         selector: '.shopping-cart-widget > div >table > tbody > tr:nth-child( 2 ) > td:nth-child( 3 )'
      },
      cartSubtotal: {
         selector: '.shopping-cart-widget > div > table > tfoot > tr > td:nth-child( 3 )'
      },
      secondItemMinus: {
         selector: `.shopping-cart-widget > div > table > tbody >
            tr:nth-child(2) > td.app-increase-buttons > button:nth-child(2)`
      },
      secondItemPlus: {
         selector: `.shopping-cart-widget > div >table > tbody > tr:nth-child(2) >
            td.app-increase-buttons > button:nth-child(1)`
      },
      firstItemMinus: {
         selector: `.shopping-cart-widget > div >table > tbody > tr:nth-child(1) >
            td.app-increase-buttons > button:nth-child(2)`
      },
      firstItemPlus: {
         selector: `.shopping-cart-widget > div >table > tbody > tr:nth-child(1) >
            td.app-increase-buttons > button:nth-child(1)`
      },
      orderButton: {
         selector: '.shopping-cart-widget > div > div > button'
      }
   }
};
