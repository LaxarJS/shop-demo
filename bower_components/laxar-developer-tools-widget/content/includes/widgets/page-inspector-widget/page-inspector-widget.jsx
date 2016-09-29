/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import React from 'react';
import patterns from 'laxar-patterns';

import wireflow from 'wireflow';

import { types, graph, layout, filterFromSelection, ROOT_ID } from './graph-helpers';

const {
  selection: { SelectionStore },
  history: { HistoryStore },
  layout: { LayoutStore },
  graph: { GraphStore, actions: { ActivateVertex } },
  settings: {
    actions: { ChangeMode, MinimapResized },
    model: { Settings, READ_ONLY, READ_WRITE },
    SettingsStore
  },
  Dispatcher,
  components: { Graph }
} = wireflow;


function create( context, eventBus, reactRender ) {

   let visible = false;
   let domAvailable = false;
   let viewModel = null;
   let viewModelCalculation = null;

   let withIrrelevantWidgets = false;
   let withContainers = true;
   let withFlatCompositions = false;

   let compositionStack = [];
   let activeComposition = null;

   let publishedSelection = null;

   patterns.resources.handlerFor( context )
      .registerResourceFromFeature( 'pageInfo', {
         onUpdateReplace: () => initializeViewModel( true )
      } );


   const publishFilter = patterns.resources.replacePublisherForFeature( context, 'filter', {
      isOptional: true
   } );

   eventBus.subscribe( `didChangeAreaVisibility.${context.widget.area}`, (event, meta) => {
      if( !visible && event.visible ) {
         visible = true;
         render();
      }
   } );

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function replaceFilter( selection, graphModel ) {
      const resource = context.features.filter.resource;
      if( !resource || selection === publishedSelection ) {
         return;
      }
      publishedSelection = selection;
      publishFilter( filterFromSelection( selection, graphModel ) );
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toggleIrrelevantWidgets() {
      withIrrelevantWidgets = !withIrrelevantWidgets;
      initializeViewModel( true );
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toggleContainers() {
      withContainers = !withContainers;
      initializeViewModel( true );
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toggleCompositions() {
      withFlatCompositions = !withFlatCompositions;
      initializeViewModel( true );
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function enterCompositionInstance( id ) {
      if( id === ROOT_ID ) {
         id = compositionStack.length > 1 ? compositionStack[ compositionStack.length - 2 ] : null;
      }
      const goToTop = id === null;
      const targetIndex = goToTop ? 0 : compositionStack.indexOf( id );
      if( targetIndex === -1 ) {
         compositionStack.push( id );
      }
      else {
         compositionStack.splice( goToTop ? 0 : targetIndex + 1, compositionStack.length - targetIndex );
      }
      activeComposition = id;
      initializeViewModel( true );
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function initializeViewModel( doReset ) {
      if( doReset ) {
         viewModel = null;
         clearTimeout( viewModelCalculation );
         viewModelCalculation = null;
         if( visible ) {
            render();
         }
      }

      if( visible ) {
         // setTimeout: used to ensure that the browser shows the spinner before stalling for layout
         viewModelCalculation = viewModelCalculation || setTimeout( () => {
            const pageTypes = types();
            const pageInfo = context.resources.pageInfo;
            const pageGraph = graph( pageInfo, {
               withIrrelevantWidgets,
               withContainers,
               compositionDisplay: withFlatCompositions ? 'FLAT' : 'COMPACT',
               activeComposition
            } );
            const dispatcher = new Dispatcher( render );
            new HistoryStore( dispatcher );
            const graphStore = new GraphStore( dispatcher, pageGraph, pageTypes );
            const layoutStore = new LayoutStore( dispatcher, graphStore );
            const settingsStore = new SettingsStore( dispatcher, Settings({ mode: READ_ONLY }) );
            const selectionStore = new SelectionStore( dispatcher, layoutStore, graphStore );

            dispatcher.register( ActivateVertex, ({ vertex }) => {
               if( vertex.kind === 'COMPOSITION' || vertex.kind === 'PAGE' ) {
                  enterCompositionInstance( vertex.id );
               }
            } );

            viewModel = { graphStore, layoutStore, settingsStore, selectionStore, dispatcher };
            render();
         }, 20 );
      }
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   function render() {
      if( !visible || !domAvailable ) {
         return;
      }

      if( !viewModel ) {
         reactRender(
            <div className='page-inspector-placeholder'>
              <i className='fa fa-cog fa-spin'></i>
            </div>
         );
         initializeViewModel();
         return;
      }

      const {
         graphStore,
         layoutStore,
         settingsStore,
         selectionStore,
         dispatcher
      } = viewModel;

      replaceFilter( selectionStore.selection, graphStore.graph );


      reactRender(
         <div className='page-inspector-row form-inline'>
            <div className='text-right'>
               <div className='pull-left'>{ renderBreadCrumbs() }</div>
               <button type='button' className='btn btn-link '
                       title="Include widgets without any links to relevant topics?"
                       onClick={toggleIrrelevantWidgets}
                  ><i className={'fa fa-toggle-' + ( withIrrelevantWidgets ? 'on' : 'off' ) }
                  ></i> <span>Isolated Widgets</span></button>
               <button type='button' className='btn btn-link'
                       title="Include area-nesting relationships?"
                       onClick={toggleContainers}
                  ><i className={'fa fa-toggle-' + ( withContainers ? 'on' : 'off' ) }
                  ></i> <span>Containers</span></button>
               <button type='button' className='btn btn-link'
                       title="Flatten compositions into their runtime contents?"
                       onClick={toggleCompositions}
                  ><i className={'fa fa-toggle-' + ( withFlatCompositions ? 'on' : 'off' ) }
                  ></i> <span>Flatten Compositions</span></button>
            </div>
            <Graph className='nbe-theme-fusebox-app'
                   types={graphStore.types}
                   model={graphStore.graph}
                   layout={layoutStore.layout}
                   measurements={layoutStore.measurements}
                   settings={settingsStore.settings}
                   selection={selectionStore.selection}
                   eventHandler={dispatcher.dispatch} />
         </div>
      );

      function renderBreadCrumbs() {
         return [
            <button key={ROOT_ID} type='button' className='btn btn-link page-inspector-breadcrumb'
                    onClick={() => enterCompositionInstance( null )}>
              <i className='fa fa-home'></i>
           </button>
         ].concat( compositionStack.map( id =>
            activeComposition === id ? id :
               <button key={id} type='button' className='btn btn-link page-inspector-breadcrumb'
                       onClick={() => enterCompositionInstance( id )}>{ id }</button>
        ) );
      }
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   return { onDomAvailable: () => {
      domAvailable = true;
      render();
   } };
}

export default {
   name: 'page-inspector-widget',
   injections: [ 'axContext', 'axEventBus', 'axReactRender' ],
   create
};
