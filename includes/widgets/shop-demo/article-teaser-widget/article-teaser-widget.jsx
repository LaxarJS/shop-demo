/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 *
 * compile using
 * > babel -m amd -d . article-teaser-widget.jsx
 */
import React from 'react';

export default {
   name: 'article-teaser-widget',
   injections: [ 'axEventBus', 'axFeatures', 'axReactRender' ],
   create: function( eventBus, features, reactRender ) {

      var resources = { article: null };
      const articleResource = features.article.resource;
      eventBus.subscribe( 'didReplace.' + articleResource, event => {
         resources.article = event.data;
         render();
      } );

      function addToCart() {
         const actionName = features.confirmation.action;
         eventBus.publish( 'takeActionRequest.' + actionName, {
            action: actionName
         } );
      }

      function render() {
         reactRender( <div>
            <ArticleHeader isSelected={ !!resources.article } />
            <ArticleTeaser article={ resources.article || { name: 'No article selected' } } />
            <div className='clearfix'>
               <button type='button'
                       className={ `btn pull-right ${resources.article ? 'btn-info' : 'ax-disabled'}` }
                       onClick={addToCart}><i className='fa fa-shopping-cart'></i> Add to Cart</button>
            </div>
         </div> );
      }

      return { onDomAvailable: render };
   }
};

const ArticleHeader = React.createClass({
   render() {
      const { isSelected } = this.props;
      return <h3 className={ `ax-function-point ${isSelected ? 'app-selection' : ''}` }>
         <i className='fa fa-search'></i> Details
      </h3>;
   }
});

const ArticleTeaser = React.createClass({
   render() {
      const { article } = this.props;
      return <div className={ 'app-teaser-wrapper clearfix' + (article.id && ' app-selection') }>
         <h4 className={ article.id || 'app-no-selection' }>{ article.name }</h4>
         <div className='row'>
            <div className='col col-md-12 app-teaser-image-wrapper'>
               { article.pictureUrl && <img className='app-teaser-image' src={ article.pictureUrl } /> }
            </div>
         </div>
         <div className='row'>
            <div className='col col-md-12'>
               <dl className='dl-horizontal'>
                  <dt className={ article.id || 'ax-disabled' }>Art. ID</dt>
                  <dd>{ article.id }</dd>

                  <dt className={ article.id || 'ax-disabled' }>Description</dt>
                  <dd dangerouslySetInnerHTML={{__html: article.htmlDescription}}></dd>

                  <dt className={ article.id || 'ax-disabled' }>Price</dt>
                  <dd>{ this.formattedPrice( article.price ) }</dd>
               </dl>
            </div>
         </div>
      </div>;
   },

   formattedPrice( price ) {
      return price == null ? null : ('€ ' + price.toFixed( 2 ));
   }

});
