/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'angular-sanitize',
   'laxar-patterns',
   'moment',
   './tracker'
], function( ng, ngSanitize, patterns, moment, tracker ) {
   'use strict';

   var settingGroups = [ 'patterns', 'interactions', 'sources' ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', '$sanitize' ];

   function Controller( $scope, $sanitize ) {

      $scope.resources = {};

      var resourceHandler = patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'filter', {
         onUpdateReplace: runFilters,
         isOptional: true
      } );

      $scope.model = {
         patterns: [
            { name: 'lifecycle', htmlIcon: '<i class="fa fa-recycle"></i>', eventTypes: [
               'endLifecycle', 'beginLifecycle'
            ] },
            { name: 'navigation', htmlIcon: '<i class="fa fa-location-arrow"></i>', eventTypes: [
               'navigate'
            ] },
            { name: 'resources', htmlIcon: '<i class="fa fa-file-text-o"></i>', eventTypes: [
               'replace', 'update', 'validate', 'save'
            ] },
            { name: 'actions', htmlIcon: '<i class="fa fa-rocket"></i>', eventTypes: [
               'takeAction'
            ] },
            { name: 'flags', htmlIcon: '<i class="fa fa-flag"></i>', eventTypes: [
               'changeFlag'
            ] },
            { name: 'i18n', htmlIcon: '<i class="fa fa-globe"></i>', eventTypes: [
               'changeLocale'
            ] },
            { name: 'visibility', htmlIcon: '<i class="fa fa-eye"></i>', eventTypes: [
               'changeAreaVisibility', 'changeWidgetVisibility'
            ] },
            { name: 'other', htmlIcon: '&nbsp;', eventTypes: [] }
         ],
         index: 0,
         eventInfos: [],
         visibleEventInfos: [],
         problemSummary: {
            count: 0,
            eventInfos: []
         },
         selectionEventInfo: null,
         settings: {
            namePattern: '',
            visibleEventsLimit: 100,
            patterns: {},
            interactions: {
               subscribe: true,
               publish: true,
               deliver: true,
               unsubscribe: true
            },
            sources: {
               widgets: true,
               runtime: true
            }
         }
      };

      $scope.view = {
         showPatterns: false,
         patternsByName: ( function() {
            var result = {};
            $scope.model.patterns.forEach( function( pattern ) {
               result[ pattern.name ] = pattern;
            } );
            return result;
         } )()
      };

      $scope.commands = {
         setAll: function( toValue ) {
            settingGroups.forEach( function( groupName ) {
               var group = $scope.model.settings[ groupName ];
               ng.forEach( group, function( _, name ) {
                  group[ name ] = toValue;
               } );
            } );
         },
         setDefaults: function() {
            settingGroups.forEach( function( groupName ) {
               var group = $scope.model.settings[ groupName ];
               ng.forEach( group, function( _, name ) {
                  group[ name ] = true;
               } );
            } );
            $scope.model.patterns.forEach( function( patternInfo ) {
               $scope.model.settings.patterns[ patternInfo.name ] = true;
            } );
            $scope.features.filter.hidePatterns.forEach( function( pattern ) {
               $scope.model.settings.patterns[ pattern ] = false;
            } );
            $scope.features.filter.hideSources.forEach( function( pattern ) {
               $scope.model.settings.sources[ pattern ] = false;
            } );
            $scope.features.filter.hideInteractions.forEach( function( pattern ) {
               $scope.model.settings.interactions[ pattern ] = false;
            } );
         },
         clearFilters: function() {
            $scope.model.settings.namePattern = '';
            $scope.model.settings.visibleEventsLimit = null;
            $scope.commands.setAll( true );
         },
         select: function( eventInfo ) {
            $scope.model.selectionEventInfo = eventInfo.selected ? null : eventInfo;
            runFilters();
         },
         discard: function() {
            $scope.model.eventInfos = [];
            $scope.model.selectionEventInfo = null;
            runFilters();
            refreshProblemSummary();
         },
         runFilters: runFilters
      };

      $scope.commands.setDefaults();

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( $scope.features.events.stream ) {
         $scope.eventBus.subscribe( 'didProduce.' + $scope.features.events.stream, function( event ) {
            if( Array.isArray( event.data ) && event.data.length ) {
               event.data.forEach( addEvent );
            }
            else {
               addEvent( event.data );
            }
            runFilters();
         } );
      }

      $scope.$watch( 'model.settings', runFilters, true );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function addEvent( eventInfo ) {

         var completeEventInfo = {
            index: ++$scope.model.index,
            interaction: eventInfo.action,
            cycleId: eventInfo.cycleId > -1 ? eventInfo.cycleId : '-',
            eventObject: eventInfo.eventObject || {},
            formattedEvent: JSON.stringify( eventInfo.eventObject, null, 3 ),
            formattedTime: {
               upper: moment( eventInfo.time ).format( 'HH:mm' ),
               lower: moment( eventInfo.time ).format( 'ss.SSS' )
            },
            name: eventInfo.event || '?',
            pattern: pattern( (eventInfo.event || '?').toLowerCase() ),
            showDetails: false,
            source: ( eventInfo.source || '?' ).replace( /^widget\./, '' ),
            target: ( eventInfo.target || '?' ).replace( /^-$/, '' ),
            time: eventInfo.time,
            selected: false,
            sourceType: ( eventInfo.source || '?' ).indexOf( 'widget.' ) === 0 ? 'widgets' : 'runtime',
            problems: tracker.track( eventInfo )
         };

         $scope.model.eventInfos.unshift( completeEventInfo );
         if( completeEventInfo.problems.length ) {
            refreshProblemSummary();
         }

         if( $scope.model.eventInfos.length > $scope.features.events.bufferSize ) {
            var removedInfo = $scope.model.eventInfos.pop();
            if( removedInfo.problems.length ) {
               refreshProblemSummary();
            }
         }

         function pattern( eventName ) {
            var matchingPatthern = $scope.model.patterns.filter( function( pattern ) {
               return pattern.eventTypes.some( function( eventType ) {
                  return eventName.indexOf( eventType.toLowerCase() ) !== -1;
               } );
            } );
            return matchingPatthern.length ? matchingPatthern[ 0 ].name : 'other';
         }

      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function refreshProblemSummary() {
         var eventInfos = $scope.model.eventInfos.filter( function( info ) {
            return info.problems.length > 0;
         } );

         $scope.model.problemSummary = {
            hasProblems: eventInfos.length > 0,
            eventInfos: eventInfos
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function runFilters() {
         var settings = $scope.model.settings;
         var numVisible = 0;

         var searchRegExp = null;
         if( settings.namePattern ) {
            try {
               searchRegExp = new RegExp( settings.namePattern, 'gi' );
            }
            catch( e ) { /* ignore invalid search pattern */ }
         }
         var selectionEventInfo = $scope.model.selectionEventInfo;

         $scope.model.visibleEventInfos = $scope.model.eventInfos.filter( function( eventInfo ) {
            if( settings.visibleEventsLimit !== null && numVisible >= settings.visibleEventsLimit ) {
               return false;
            }
            if( !settings.interactions[ eventInfo.interaction ] ) {
               return false;
            }
            if( !settings.patterns[ eventInfo.pattern ] ) {
               return false;
            }
            if( !settings.sources[ eventInfo.sourceType ] ) {
               return false;
            }
            if( !matchesFilterResource( eventInfo ) ) {
               return false;
            }
            if( !matchesSearchExpression( eventInfo, searchRegExp ) ) {
               return false;
            }
            ++numVisible;
            return true;
         } );

         // modify matches in place
         $scope.model.visibleEventInfos.forEach( function( eventInfo ) {
            eventInfo.htmlName = htmlValue( eventInfo.name, searchRegExp, '.' );
            eventInfo.htmlSource = htmlValue( eventInfo.source, searchRegExp, '#' );
            eventInfo.htmlTarget = htmlValue( eventInfo.target, searchRegExp, '#' );
            eventInfo.selected = !!selectionEventInfo && inSelection( eventInfo, selectionEventInfo );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function matchesSearchExpression( eventInfo, searchRegExp ) {
         return !searchRegExp || [ eventInfo.name, eventInfo.source, eventInfo.target ]
            .some( function( field ) {
               var matches = searchRegExp.test( field );
               searchRegExp.lastIndex = 0;
               return !!matches;
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var patternTopics = {
         RESOURCE: [ 'didReplace', 'didUpdate' ],
         ACTION: [ 'takeActionRequest', 'willTakeAction', 'didTakeAction' ],
         FLAG: [ 'didChangeFlag' ],
         CONTAINER: [ 'changeAreaVisibilityRequest', 'willChangeAreaVisibility', 'didChangeAreaVisibility' ]
      };

      function matchesFilterResource( eventInfo ) {
         if( !$scope.resources.filter ) {
            return true;
         }

         var filterTopics = $scope.resources.filter.topics || [];
         var filterParticipants = $scope.resources.filter.participants || [];
         if( !filterTopics.length && !filterParticipants.length ) {
            return true;
         }

         var matchesTopicFilter = filterTopics
            .some( function( item ) {
               var prefixes = patternTopics[ item.pattern ];
               return prefixes.some( function( prefix ) {
                  var topic = prefix + '.' + item.topic;
                  return eventInfo.name === topic || eventInfo.name.indexOf( topic + '.' ) === 0;
               } );
            } );

         var matchesParticipantsFilter = [ 'target', 'source' ].some( function( field ) {
            var value = eventInfo[ field ];
            return filterParticipants
               .map( function( _ ) { return _.participant; } )
               .some( isSuffixOf( value ) );
         } );

         return matchesTopicFilter || matchesParticipantsFilter;

         function isSuffixOf( value ) {
            return function( _ ) {
               var tail = '#' + _;
               return value.length >= tail.length && value.indexOf( tail ) === value.length - tail.length;
            };
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function htmlValue( value, searchRegExp, splitCharacter ) {
         var html = $sanitize( value );
         var wasSplit = false;
         if( !searchRegExp ) {
            return wrap( split( html, false ) );
         }

         var parts = [];
         var match;
         var lastIndex = 0;
         var limit = 1;
         while( limit-- && ( match = searchRegExp.exec( html ) ) !== null ) {
            if( match.index > lastIndex ) {
               parts.push( split( html.substring( lastIndex, match.index ), false ) );
            }
            parts.push( '<b>' );
            parts.push( split( match[ 0 ], true ) );
            parts.push( '</b>' );
            lastIndex = searchRegExp.lastIndex;
         }
         searchRegExp.lastIndex = 0;
         parts.push( split( html.substring( lastIndex, html.length ) ) );
         return wrap( parts.join( '' ) );

         function wrap( whole ) {
            return '<span>' + whole + '</span>';
         }

         function split( part, isBold ) {
            if( !splitCharacter || wasSplit ) {
               return part;
            }

            var splitPoint = part.indexOf( splitCharacter );
            if( splitPoint === -1 ) {
               return part;
            }

            wasSplit = true;
            return part.substring( 0, splitPoint ) +
               ( isBold ? '</b>' : '' ) + '</span><br /><span>' + ( isBold ? '<b>' : '' ) +
               part.substring( splitPoint + 1, part.length );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function inSelection( eventInfo, selectionEventInfo ) {
         if( !selectionEventInfo ) {
            return false;
         }

         return eventInfo === selectionEventInfo || (
            eventInfo.cycleId === selectionEventInfo.cycleId &&
            eventInfo.source === selectionEventInfo.source &&
            eventInfo.name === selectionEventInfo.name
         );
      }

   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function separate( label, separator, defaultText ) {
      var name = label || defaultText;
      var splitPoint = name.indexOf( separator );
      return {
         upper: splitPoint === -1 ? name : name.substr( 0, splitPoint ),
         lower: splitPoint === -1 ? defaultText : name.substr( splitPoint, name.length )
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'eventsDisplayWidget', [ 'ngSanitize' ] )
      .controller( 'EventsDisplayWidgetController', Controller );

} );
