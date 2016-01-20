/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'laxar-patterns'
], function( ax, patterns ) {

   var LIFECYCLE = 'lifecycle';
   var ACTION = 'action';
   var FLAG = 'flag';
   var RESOURCE = 'resource';
   var ERROR = 'error';
   var OTHER = 'other';


   var types = {
      beginLifecycleRequest: LIFECYCLE,

      takeActionRequest: ACTION,
      willTakeAction: ACTION,
      didTakeAction: ACTION,

      didChangeFlag: FLAG,

      didReplace: RESOURCE,
      didUpdate: RESOURCE,
      validateRequest: RESOURCE,
      willValidate: RESOURCE,
      didValidate: RESOURCE,
      saveRequest: RESOURCE,
      willSave: RESOURCE,
      didSave: RESOURCE,

      didEncounterError: ERROR
   };

   var states = {
      resource: {},
      action: {},
      flag: {}
   };

   // developer API:
   return {
      state: function() {
         return ax.object.deepClone( states );
      },
      track: track
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function eventType( eventItem ) {
      var topics = eventItem.event.split( '.' );
      var verb = topics[ 0 ];
      return types[ verb ] || OTHER;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function eventPatternTopic( eventItem ) {
      var topics = eventItem.event.split( '.' );
      return topics[ 1 ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function track( eventItem ) {
      if( eventItem.action !== 'publish' ) {
         return [];
      }

      var sender = ( eventItem.source || 'unknown' ).replace( /.*#(.*)/g, '$1' );
      var topics = eventItem.event.split( '.' );
      var verb = topics[ 0 ];
      var patternTopic = eventPatternTopic( eventItem );
      var payload = eventItem.eventObject;

      if( !patternTopic ) {
         return [ { description: 'Event has an invalid name: The second topic is missing!' } ];
      }
      if( !payload ) {
         return [ { description: 'Event has no payload!' } ];
      }

      var type = eventType( eventItem );
      if( type === LIFECYCLE ) {
         return resetEvents();
      }
      if( type === RESOURCE ) {
         return trackResourceEvent( payload, sender, verb, patternTopic );
      }
      if( type === ACTION ) {
         return trackActionEvent( payload, sender, verb, patternTopic );
      }
      if( type === FLAG ) {
         return trackFlagEvent( payload, sender, verb, patternTopic );
      }
      return [];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function resetEvents() {
      states = {
         resource: {},
         action: {},
         flag: {}
      };
      return [];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function trackActionEvent( payload, subject, verb, actionName ) {
      var problems = [];
      if( !payload.action ) {
         problems.push( { description: 'Event is missing "action" field in payload.' } );
      }

      var state = states.action[ actionName ] = states.action[ actionName ] || {
         state: 'inactive',
         numRequests: 0,
         requestedBy: null,
         outstandingReplies: {}
      };

      switch( verb ) {

         case 'takeActionRequest':
            state.state = 'active';
            state.requestedBy = subject;
            ++state.numRequests;
            return problems;

         case 'willTakeAction':
            if( !state.outstandingReplies.hasOwnProperty( subject ) ) {
               state.outstandingReplies[ subject ] = 0;
            }
            ++state.outstandingReplies[ subject ];
            return problems;

         case 'didTakeAction':
            if( state.outstandingReplies.hasOwnProperty( subject ) ) {
               --state.outstandingReplies[ subject ];
               if( state.outstandingReplies[ subject ] === 0 ) {
                  delete state.outstandingReplies[ subject ];
               }
            }

            if( Object.keys( state.outstandingReplies ).length === 0 ) {
               state.state = 'inactive';
            }
            return problems;

         default:
            return problems;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function trackFlagEvent( payload, sender, verb, flagName ) {
      var problems = [];
      if( !payload.flag ) {
         problems.push( { description: 'Event is missing "flag" field in payload.' } );
      }

      states.flag[ flagName ] = states.flag[ flagName ] || {
         state: undefined,
         lastModificationBy: null
      };

      if( verb === 'didChangeFlag' ) {
         if( payload.state === undefined ) {
            problems.push( { description: 'Event is missing "state" field in payload.' } );
            return problems;
         }
         states.flag[ flagName ].state = payload.state;
         states.flag[ flagName ].lastModificationBy = sender;
      }

      return problems;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function trackResourceEvent( payload, sender, verb, resourceName ) {
      var problems = [];
      if( !payload.resource ) {
         problems.push( { description: 'Event is missing "resource" field in payload.' } );
      }
      var state;

      switch( verb ) {

         case 'didReplace':
            if (payload.data === undefined) {
               problems.push( { description: 'didReplace event-payload is missing "data" field.' } );
            }
            state = states.resource[ resourceName ] = states.resource[ resourceName ] || {
               state: 'replaced',
               master: sender,
               lastModificationBy: null,
               value: null
            };
            if( state.master !== sender ) {
               problems.push( { description: ax.string.format(
                  'master/master conflict: for resource `[0]` (first master: [1], second master: [2])"',
                  [ resourceName, state.master, sender ]
               ) } );
            }
            state.lastModificationBy = sender;
            state.value = payload.data;
            return problems;

         case 'didUpdate':
            state = states.resource[ resourceName ];
            if( !state ) {
               problems.push( {
                  description: 'Sender "' + sender + '" sent didUpdate without prior didReplace.'
               } );
            }
            else if( state.value === null || state.value === undefined ) {
               problems.push( {
                  description: 'Sender "' + sender + '" sent didUpdate, but resource is ' + state.value
               } );
            }
            if( !payload.patches ) {
               problems.push( {
                  description: 'Sender "' + sender + '" sent didUpdate without patches field.'
               } );
            }
            if( problems.length ) {
               return problems;
            }

            state.lastModificationBy = sender;
            try {
               patterns.json.applyPatch( state.value, payload.patches );
            }
            catch( error ) {
               problems.push( {
                  description: 'Failed to apply patch sequence in didUpdate from "' + sender + '"'
               } );
            }
            return problems;

         default:
            return problems;
      }
   }
} );
