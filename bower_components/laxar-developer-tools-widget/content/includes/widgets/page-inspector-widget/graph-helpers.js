/* jshint ignore:start */
define(['exports', 'wireflow', 'laxar'], function (exports, _wireflow, _laxar) {/**
                                                                                 * Copyright 2016 aixigo AG
                                                                                 * Released under the MIT license.
                                                                                 * http://laxarjs.org/license
                                                                                 */'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();exports.graph = graph;exports.layout = layout;exports.types = types;exports.compositionStack = compositionStack;exports.filterFromSelection = filterFromSelection;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}var _wireflow2 = _interopRequireDefault(_wireflow);




   var TYPE_CONTAINER = 'CONTAINER';var 



   layoutModel = _wireflow2['default'].layout.model;var 


   graphModel = _wireflow2['default'].graph.model;



   var edgeTypes = { 
      RESOURCE: { 
         hidden: false, 
         label: 'Resources' }, 

      FLAG: { 
         label: 'Flags', 
         hidden: false }, 

      ACTION: { 
         label: 'Actions', 
         hidden: false }, 

      CONTAINER: { 
         hidden: false, 
         label: 'Container', 
         owningPort: 'outbound' } };



   var ROOT_ID = '.';exports.ROOT_ID = ROOT_ID;

   /**
    * Create a wireflow graph from a given page/widget information model.
    *
    * @param {Object} pageInfo
    * @param {Boolean=false} pageInfo.withIrrelevantWidgets
    *   If set to `true`, widgets without any relevance to actions/resources/flags are removed.
    *   Containers of widgets (that are relevant by this measure) are kept.
    * @param {Boolean=false} pageInfo.withContainers
    *   If set to `true`, Container relationships are included in the graph representation.
    * @param {String='FLAT'} pageInfo.compositionDisplay
    *   If set to `'COMPACT'` (default), compositions are represented by an instance node, reflecting their development-time model.
    *   If set to `'FLAT'`, compositions are replaced recursively by their configured expansion, reflecting their run-time model.
    * @param {String=null} pageInfo.activeComposition
    *   If set, generate a graph for the contents of the given composition, rather than for the page.
    */
   function graph(pageInfo, options) {var _options$withIrrelevantWidgets = 






      options.withIrrelevantWidgets;var withIrrelevantWidgets = _options$withIrrelevantWidgets === undefined ? false : _options$withIrrelevantWidgets;var _options$withContainers = options.withContainers;var withContainers = _options$withContainers === undefined ? true : _options$withContainers;var _options$compositionDisplay = options.compositionDisplay;var compositionDisplay = _options$compositionDisplay === undefined ? 'FLAT' : _options$compositionDisplay;var _options$activeComposition = options.activeComposition;var activeComposition = _options$activeComposition === undefined ? null : _options$activeComposition;var 


      pageReference = 



      pageInfo.pageReference;var pageDefinitions = pageInfo.pageDefinitions;var widgetDescriptors = pageInfo.widgetDescriptors;var compositionDefinitions = pageInfo.compositionDefinitions;

      var page = activeComposition ? 
      compositionDefinitions[pageReference][activeComposition][compositionDisplay] : 
      pageDefinitions[pageReference][compositionDisplay];

      var vertices = {};
      var edges = {};
      identifyVertices();
      if (withContainers) {
         identifyContainers();}

      if (!withIrrelevantWidgets) {
         pruneIrrelevantWidgets(withContainers);}

      pruneEmptyEdges();

      return graphModel.convert.graph({ vertices: vertices, edges: edges });

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function identifyVertices() {

         vertices[ROOT_ID] = rootVertex();

         Object.keys(page.areas).forEach(function (areaName) {
            page.areas[areaName].forEach(function (pageAreaItem) {
               if (isWidget(pageAreaItem)) {
                  processWidgetInstance(pageAreaItem, areaName);} else 

               if (isComposition(pageAreaItem)) {
                  processCompositionInstance(pageAreaItem, areaName);} else 

               if (isLayout(pageAreaItem)) {
                  processLayoutInstance(pageAreaItem, areaName);}});});




         ////////////////////////////////////////////////////////////////////////////////////////////////////////

         function rootVertex() {
            var ports = identifyPorts({}, {});
            if (activeComposition) {
               // find composition instance within embedding page/composition:
               var pageCompositionDefinitions = Object.
               keys(compositionDefinitions[pageReference]).
               map(function (key) {return compositionDefinitions[pageReference][key];});

               [pageDefinitions[pageReference]].concat(pageCompositionDefinitions).
               forEach(function (pagelike) {
                  var areas = pagelike.COMPACT.areas;
                  Object.keys(areas).
                  forEach(function (name) {return areas[name].
                     filter(function (item) {return item.id === activeComposition;}).
                     forEach(function (item) {
                        var features = item.features;
                        var schema = page.features;
                        ports = identifyPorts(features || {}, schema);
                        // swap port directions (from inside, an input is an output, and vice versa):
                        ports = { inbound: ports.outbound, outbound: ports.inbound };});});});}





            return { 
               ROOT_ID: ROOT_ID, 
               label: activeComposition ? '[parent]' : '[root] ' + pageReference, 
               kind: 'PAGE', 
               ports: ports };}



         ///////////////////////////////////////////////////////////////////////////////////////////////////////////

         function processLayoutInstance(layout, areaName) {
            vertices[layout.id] = { 
               id: layout.id, 
               label: layout.id, 
               kind: 'LAYOUT', 
               ports: { inbound: [], outbound: [] } };}



         ////////////////////////////////////////////////////////////////////////////////////////////////////////

         function processWidgetInstance(widgetInstance, areaName) {
            var descriptor = widgetDescriptors[widgetInstance.widget];

            var kinds = { 
               widget: 'WIDGET', 
               activity: 'ACTIVITY' };var 


            id = widgetInstance.id;
            var ports = identifyPorts(widgetInstance.features, descriptor.features);
            vertices[id] = { 
               id: id, 
               label: id, 
               kind: kinds[descriptor.integration.type], 
               ports: ports };}



         ////////////////////////////////////////////////////////////////////////////////////////////////////////

         function processCompositionInstance(compositionInstance, areaName) {var 
            id = compositionInstance.id;
            var definition = compositionDefinitions[pageReference][id].COMPACT;

            var schema = definition.features.type ? 
            definition.features : 
            { type: 'object', properties: definition.features };

            var ports = identifyPorts(
            compositionInstance.features || {}, 
            _laxar.object.options(schema));


            vertices[id] = { 
               id: id, 
               label: id, 
               kind: 'COMPOSITION', 
               ports: ports };}



         ///////////////////////////////////////////////////////////////////////////////////////////////////////////

         function identifyPorts(value, schema, path, ports) {
            path = path || [];
            ports = ports || { inbound: [], outbound: [] };
            if (!value || !schema) {
               return ports;}


            if (!schema.type) {
               // TODO: cleanup, invert role
               schema = { type: 'object', properties: schema };}


            if (value.enabled === false) {
               // feature can be disabled, and was disabled
               return ports;}

            if (schema.type === 'string' && schema.axRole && (
            schema.format === 'topic' || schema.format === 'flag-topic')) {
               var type = schema.axPattern ? schema.axPattern.toUpperCase() : inferEdgeType(path);
               if (!type) {return;}
               var edgeId = type + ':' + value;
               var label = path.join('.');
               var id = path.join(':');
               ports[schema.axRole === 'outlet' ? 'outbound' : 'inbound'].push({ 
                  label: label, id: id, type: type, edgeId: edgeId });

               if (edgeId && !edges[edgeId]) {
                  edges[edgeId] = { type: type, id: edgeId, label: value };}}



            if (schema.type === 'object' && schema.properties) {
               Object.keys(schema.properties).forEach(function (key) {
                  var propertySchema = schema.properties[key] || schema.additionalProperties;
                  identifyPorts(value[key], propertySchema, path.concat([key]), ports);});}


            if (schema.type === 'array') {
               value.forEach(function (item, i) {
                  identifyPorts(item, schema.items, path.concat([i]), ports);});}


            return ports;}


         ///////////////////////////////////////////////////////////////////////////////////////////////////////////

         function inferEdgeType(_x) {var _again = true;_function: while (_again) {var path = _x;_again = false;
               if (!path.length) {
                  return null;}

               var lastSegment = path[path.length - 1];
               if (['action', 'flag', 'resource'].indexOf(lastSegment) !== -1) {
                  return lastSegment.toUpperCase();}

               if (lastSegment === 'onActions') {
                  return 'ACTION';}_x = 

               path.slice(0, path.length - 1);_again = true;lastSegment = undefined;continue _function;}}}




      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function identifyContainers() {
         var type = TYPE_CONTAINER;

         Object.keys(page.areas).forEach(function (areaName) {
            insertEdge(areaName);
            var owner = findOwner(areaName);
            if (!owner) {
               return;}


            var containsAnything = false;
            page.areas[areaName].
            filter(function (item) {
               return isComposition(item) ? 
               compositionDisplay === 'COMPACT' : 
               true;}).

            forEach(function (item) {
               if (vertices[item.id]) {
                  insertUplink(vertices[item.id], areaName);
                  containsAnything = true;}});


            if (containsAnything) {
               insertOwnerPort(owner, areaName);}});



         function findOwner(areaName) {
            if (areaName.indexOf('.') <= 0) {
               return vertices[ROOT_ID];}

            var prefix = areaName.slice(0, areaName.lastIndexOf('.'));
            return vertices[prefix];}


         function insertOwnerPort(vertex, areaName) {
            vertex.ports.outbound.unshift({ 
               id: 'CONTAINER:' + areaName, 
               type: TYPE_CONTAINER, 
               edgeId: areaEdgeId(areaName), 
               label: areaName });}



         function insertUplink(vertex, areaName) {
            vertex.ports.inbound.unshift({ 
               id: 'CONTAINER:anchor', 
               type: TYPE_CONTAINER, 
               edgeId: areaEdgeId(areaName), 
               label: 'anchor' });}



         function insertEdge(areaName) {
            var id = areaEdgeId(areaName);
            edges[id] = { id: id, type: type, label: areaName };}


         function areaEdgeId(areaName) {
            return TYPE_CONTAINER + ':' + areaName;}}



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function pruneIrrelevantWidgets(withContainers) {
         var toPrune = [];
         do {
            toPrune.forEach(function (id) {delete vertices[id];});
            pruneEmptyEdges();
            toPrune = mark();} while (
         toPrune.length);

         function mark() {
            var pruneList = [];
            Object.keys(vertices).forEach(function (vId) {
               var ports = vertices[vId].ports;
               if (ports.inbound.length <= withContainers ? 1 : 0) {
                  if (ports.outbound.every(function (_) {return !_.edgeId;})) {
                     pruneList.push(vId);}}});



            return pruneList;}}



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function pruneEmptyEdges() {
         var toPrune = [];
         Object.keys(edges).forEach(function (edgeId) {
            var type = edgeTypes[edges[edgeId].type];
            var sources = Object.keys(vertices).filter(isSourceOf(edgeId));
            var sinks = Object.keys(vertices).filter(isSinkOf(edgeId));
            var hasSources = sources.length > 0;
            var hasSinks = sinks.length > 0;
            var isEmpty = type.owningPort ? !hasSources || !hasSinks : !hasSources && !hasSinks;
            if (!isEmpty) {
               return;}


            toPrune.push(edgeId);
            sources.concat(sinks).forEach(function (vertexId) {
               var ports = vertices[vertexId].ports;
               ports.inbound.concat(ports.outbound).forEach(function (port) {
                  port.edgeId = port.edgeId === edgeId ? null : port.edgeId;});});});



         toPrune.forEach(function (id) {delete edges[id];});

         function isSourceOf(edgeId) {
            return function (vertexId) {
               return vertices[vertexId].ports.inbound.some(function (port) {return port.edgeId === edgeId;});};}



         function isSinkOf(edgeId) {
            return function (vertexId) {
               return vertices[vertexId].ports.outbound.some(function (port) {return port.edgeId === edgeId;});};}}}






   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function isComposition(pageAreaItem) {
      return !!pageAreaItem.composition;}


   function isWidget(pageAreaItem) {
      return !!pageAreaItem.widget;}


   function isLayout(pageAreaItem) {
      return !!pageAreaItem.layout;}


   function either(f, g) {
      return function () {
         return f.apply(this, arguments) || g.apply(this, arguments);};}



   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function layout(graph) {
      return layoutModel.convert.layout({ 
         vertices: {}, 
         edges: {} });}



   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function types() {
      return graphModel.convert.types(edgeTypes);}


   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function compositionStack(compositionInstanceId) {
      return [];}


   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function filterFromSelection(selection, graphModel) {
      var topics = selection.edges.flatMap(function (edgeId) {var _edgeId$split = 
         edgeId.split(':');var _edgeId$split2 = _slicedToArray(_edgeId$split, 2);var type = _edgeId$split2[0];var topic = _edgeId$split2[1];
         return type === 'CONTAINER' ? [] : [{ pattern: type, topic: topic }];}).
      toJS();

      var participants = selection.vertices.flatMap(function (vertexId) {var _graphModel$vertices$get = 
         graphModel.vertices.get(vertexId);var id = _graphModel$vertices$get.id;var kind = _graphModel$vertices$get.kind;
         return kind === 'PAGE' || kind === 'LAYOUT' ? [] : [{ kind: kind, participant: vertexId }];});


      return { 
         topics: topics, 
         participants: participants };}});
//# sourceMappingURL=data:application/json;base64,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QUVKLGFBQU87QUFDSixlQUFNLEVBQU4sTUFBTTtBQUNOLHFCQUFZLEVBQVosWUFBWSxFQUNkLENBQUMsQ0FDSiIsImZpbGUiOiJncmFwaC1oZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNiBhaXhpZ28gQUdcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqIGh0dHA6Ly9sYXhhcmpzLm9yZy9saWNlbnNlXG4gKi9cbmltcG9ydCB3aXJlZmxvdyBmcm9tICd3aXJlZmxvdyc7XG5cbmltcG9ydCB7IG9iamVjdCB9IGZyb20gJ2xheGFyJztcblxuY29uc3QgVFlQRV9DT05UQUlORVIgPSAnQ09OVEFJTkVSJztcblxuY29uc3Qge1xuICBsYXlvdXQ6IHtcbiAgICAgbW9kZWw6IGxheW91dE1vZGVsXG4gIH0sXG4gIGdyYXBoOiB7XG4gICAgbW9kZWw6IGdyYXBoTW9kZWxcbiAgfVxufSA9IHdpcmVmbG93O1xuXG5jb25zdCBlZGdlVHlwZXMgPSB7XG4gICBSRVNPVVJDRToge1xuICAgICAgaGlkZGVuOiBmYWxzZSxcbiAgICAgIGxhYmVsOiAnUmVzb3VyY2VzJ1xuICAgfSxcbiAgIEZMQUc6IHtcbiAgICAgIGxhYmVsOiAnRmxhZ3MnLFxuICAgICAgaGlkZGVuOiBmYWxzZVxuICAgfSxcbiAgIEFDVElPTjoge1xuICAgICAgbGFiZWw6ICdBY3Rpb25zJyxcbiAgICAgIGhpZGRlbjogZmFsc2VcbiAgIH0sXG4gICBDT05UQUlORVI6IHtcbiAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICBsYWJlbDogJ0NvbnRhaW5lcicsXG4gICAgICBvd25pbmdQb3J0OiAnb3V0Ym91bmQnXG4gICB9XG59O1xuXG5leHBvcnQgY29uc3QgUk9PVF9JRCA9ICcuJztcblxuLyoqXG4gKiBDcmVhdGUgYSB3aXJlZmxvdyBncmFwaCBmcm9tIGEgZ2l2ZW4gcGFnZS93aWRnZXQgaW5mb3JtYXRpb24gbW9kZWwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhZ2VJbmZvXG4gKiBAcGFyYW0ge0Jvb2xlYW49ZmFsc2V9IHBhZ2VJbmZvLndpdGhJcnJlbGV2YW50V2lkZ2V0c1xuICogICBJZiBzZXQgdG8gYHRydWVgLCB3aWRnZXRzIHdpdGhvdXQgYW55IHJlbGV2YW5jZSB0byBhY3Rpb25zL3Jlc291cmNlcy9mbGFncyBhcmUgcmVtb3ZlZC5cbiAqICAgQ29udGFpbmVycyBvZiB3aWRnZXRzICh0aGF0IGFyZSByZWxldmFudCBieSB0aGlzIG1lYXN1cmUpIGFyZSBrZXB0LlxuICogQHBhcmFtIHtCb29sZWFuPWZhbHNlfSBwYWdlSW5mby53aXRoQ29udGFpbmVyc1xuICogICBJZiBzZXQgdG8gYHRydWVgLCBDb250YWluZXIgcmVsYXRpb25zaGlwcyBhcmUgaW5jbHVkZWQgaW4gdGhlIGdyYXBoIHJlcHJlc2VudGF0aW9uLlxuICogQHBhcmFtIHtTdHJpbmc9J0ZMQVQnfSBwYWdlSW5mby5jb21wb3NpdGlvbkRpc3BsYXlcbiAqICAgSWYgc2V0IHRvIGAnQ09NUEFDVCdgIChkZWZhdWx0KSwgY29tcG9zaXRpb25zIGFyZSByZXByZXNlbnRlZCBieSBhbiBpbnN0YW5jZSBub2RlLCByZWZsZWN0aW5nIHRoZWlyIGRldmVsb3BtZW50LXRpbWUgbW9kZWwuXG4gKiAgIElmIHNldCB0byBgJ0ZMQVQnYCwgY29tcG9zaXRpb25zIGFyZSByZXBsYWNlZCByZWN1cnNpdmVseSBieSB0aGVpciBjb25maWd1cmVkIGV4cGFuc2lvbiwgcmVmbGVjdGluZyB0aGVpciBydW4tdGltZSBtb2RlbC5cbiAqIEBwYXJhbSB7U3RyaW5nPW51bGx9IHBhZ2VJbmZvLmFjdGl2ZUNvbXBvc2l0aW9uXG4gKiAgIElmIHNldCwgZ2VuZXJhdGUgYSBncmFwaCBmb3IgdGhlIGNvbnRlbnRzIG9mIHRoZSBnaXZlbiBjb21wb3NpdGlvbiwgcmF0aGVyIHRoYW4gZm9yIHRoZSBwYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoIHBhZ2VJbmZvLCBvcHRpb25zICkge1xuXG4gICBjb25zdCB7XG4gICAgICB3aXRoSXJyZWxldmFudFdpZGdldHMgPSBmYWxzZSxcbiAgICAgIHdpdGhDb250YWluZXJzID0gdHJ1ZSxcbiAgICAgIGNvbXBvc2l0aW9uRGlzcGxheSA9ICdGTEFUJyxcbiAgICAgIGFjdGl2ZUNvbXBvc2l0aW9uID0gbnVsbFxuICAgfSA9IG9wdGlvbnM7XG5cbiAgIGNvbnN0IHtcbiAgICAgIHBhZ2VSZWZlcmVuY2UsXG4gICAgICBwYWdlRGVmaW5pdGlvbnMsXG4gICAgICB3aWRnZXREZXNjcmlwdG9ycyxcbiAgICAgIGNvbXBvc2l0aW9uRGVmaW5pdGlvbnNcbiAgIH0gPSBwYWdlSW5mbztcblxuICAgY29uc3QgcGFnZSA9IGFjdGl2ZUNvbXBvc2l0aW9uID9cbiAgICAgIGNvbXBvc2l0aW9uRGVmaW5pdGlvbnNbIHBhZ2VSZWZlcmVuY2UgXVsgYWN0aXZlQ29tcG9zaXRpb24gXVsgY29tcG9zaXRpb25EaXNwbGF5IF0gOlxuICAgICAgcGFnZURlZmluaXRpb25zWyBwYWdlUmVmZXJlbmNlIF1bIGNvbXBvc2l0aW9uRGlzcGxheSBdO1xuXG4gICBjb25zdCB2ZXJ0aWNlcyA9IHt9O1xuICAgY29uc3QgZWRnZXMgPSB7fTtcbiAgIGlkZW50aWZ5VmVydGljZXMoKTtcbiAgIGlmKCB3aXRoQ29udGFpbmVycyApIHtcbiAgICAgIGlkZW50aWZ5Q29udGFpbmVycygpO1xuICAgfVxuICAgaWYoICF3aXRoSXJyZWxldmFudFdpZGdldHMgKSB7XG4gICAgICBwcnVuZUlycmVsZXZhbnRXaWRnZXRzKCB3aXRoQ29udGFpbmVycyApO1xuICAgfVxuICAgcHJ1bmVFbXB0eUVkZ2VzKCk7XG5cbiAgIHJldHVybiBncmFwaE1vZGVsLmNvbnZlcnQuZ3JhcGgoIHsgdmVydGljZXMsIGVkZ2VzIH0gKTtcblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gaWRlbnRpZnlWZXJ0aWNlcygpIHtcblxuICAgICAgdmVydGljZXNbIFJPT1RfSUQgXSA9IHJvb3RWZXJ0ZXgoKTtcblxuICAgICAgT2JqZWN0LmtleXMoIHBhZ2UuYXJlYXMgKS5mb3JFYWNoKCBhcmVhTmFtZSA9PiB7XG4gICAgICAgICBwYWdlLmFyZWFzWyBhcmVhTmFtZSBdLmZvckVhY2goIHBhZ2VBcmVhSXRlbSA9PiB7XG4gICAgICAgICAgICBpZiggaXNXaWRnZXQoIHBhZ2VBcmVhSXRlbSApICkge1xuICAgICAgICAgICAgICAgcHJvY2Vzc1dpZGdldEluc3RhbmNlKCBwYWdlQXJlYUl0ZW0sIGFyZWFOYW1lICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKCBpc0NvbXBvc2l0aW9uKCBwYWdlQXJlYUl0ZW0gKSApIHtcbiAgICAgICAgICAgICAgIHByb2Nlc3NDb21wb3NpdGlvbkluc3RhbmNlKCBwYWdlQXJlYUl0ZW0sIGFyZWFOYW1lICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKCBpc0xheW91dCggcGFnZUFyZWFJdGVtICkgKSB7XG4gICAgICAgICAgICAgICBwcm9jZXNzTGF5b3V0SW5zdGFuY2UoIHBhZ2VBcmVhSXRlbSwgYXJlYU5hbWUgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0gKTtcbiAgICAgIH0gKTtcblxuICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gcm9vdFZlcnRleCgpIHtcbiAgICAgICAgIGxldCBwb3J0cyA9IGlkZW50aWZ5UG9ydHMoIHt9LCB7fSApO1xuICAgICAgICAgaWYoIGFjdGl2ZUNvbXBvc2l0aW9uICkge1xuICAgICAgICAgICAgLy8gZmluZCBjb21wb3NpdGlvbiBpbnN0YW5jZSB3aXRoaW4gZW1iZWRkaW5nIHBhZ2UvY29tcG9zaXRpb246XG4gICAgICAgICAgICBjb25zdCBwYWdlQ29tcG9zaXRpb25EZWZpbml0aW9ucyA9IE9iamVjdFxuICAgICAgICAgICAgICAgLmtleXMoIGNvbXBvc2l0aW9uRGVmaW5pdGlvbnNbIHBhZ2VSZWZlcmVuY2UgXSApXG4gICAgICAgICAgICAgICAubWFwKCBrZXkgPT4gY29tcG9zaXRpb25EZWZpbml0aW9uc1sgcGFnZVJlZmVyZW5jZSBdWyBrZXkgXSApO1xuXG4gICAgICAgICAgICBbIHBhZ2VEZWZpbml0aW9uc1sgcGFnZVJlZmVyZW5jZSBdIF0uY29uY2F0KCBwYWdlQ29tcG9zaXRpb25EZWZpbml0aW9ucyApXG4gICAgICAgICAgICAgICAuZm9yRWFjaCggcGFnZWxpa2UgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYXJlYXMgPSBwYWdlbGlrZS5DT01QQUNULmFyZWFzO1xuICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoIGFyZWFzIClcbiAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKCBuYW1lID0+IGFyZWFzWyBuYW1lIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoIGl0ZW0gPT4gaXRlbS5pZCA9PT0gYWN0aXZlQ29tcG9zaXRpb24gKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goIGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBpdGVtLmZlYXR1cmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hID0gcGFnZS5mZWF0dXJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRzID0gaWRlbnRpZnlQb3J0cyggZmVhdHVyZXMgfHwge30sIHNjaGVtYSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3dhcCBwb3J0IGRpcmVjdGlvbnMgKGZyb20gaW5zaWRlLCBhbiBpbnB1dCBpcyBhbiBvdXRwdXQsIGFuZCB2aWNlIHZlcnNhKTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRzID0geyBpbmJvdW5kOiBwb3J0cy5vdXRib3VuZCwgb3V0Ym91bmQ6IHBvcnRzLmluYm91bmQgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gKVxuICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgIH0gKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFJPT1RfSUQsXG4gICAgICAgICAgICBsYWJlbDogYWN0aXZlQ29tcG9zaXRpb24gPyAnW3BhcmVudF0nIDogKCAnW3Jvb3RdICcgKyBwYWdlUmVmZXJlbmNlICksXG4gICAgICAgICAgICBraW5kOiAnUEFHRScsXG4gICAgICAgICAgICBwb3J0c1xuICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gcHJvY2Vzc0xheW91dEluc3RhbmNlKCBsYXlvdXQsIGFyZWFOYW1lICkge1xuICAgICAgICAgdmVydGljZXNbIGxheW91dC5pZCBdID0ge1xuICAgICAgICAgICAgaWQ6IGxheW91dC5pZCxcbiAgICAgICAgICAgIGxhYmVsOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICBraW5kOiAnTEFZT1VUJyxcbiAgICAgICAgICAgIHBvcnRzOiB7IGluYm91bmQ6IFtdLCBvdXRib3VuZDogW10gfVxuICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gcHJvY2Vzc1dpZGdldEluc3RhbmNlKCB3aWRnZXRJbnN0YW5jZSwgYXJlYU5hbWUgKSB7XG4gICAgICAgICBjb25zdCBkZXNjcmlwdG9yID0gd2lkZ2V0RGVzY3JpcHRvcnNbIHdpZGdldEluc3RhbmNlLndpZGdldCBdO1xuXG4gICAgICAgICBjb25zdCBraW5kcyA9IHtcbiAgICAgICAgICAgIHdpZGdldDogJ1dJREdFVCcsXG4gICAgICAgICAgICBhY3Rpdml0eTogJ0FDVElWSVRZJ1xuICAgICAgICAgfTtcblxuICAgICAgICAgY29uc3QgeyBpZCB9ID0gd2lkZ2V0SW5zdGFuY2U7XG4gICAgICAgICBjb25zdCBwb3J0cyA9IGlkZW50aWZ5UG9ydHMoIHdpZGdldEluc3RhbmNlLmZlYXR1cmVzLCBkZXNjcmlwdG9yLmZlYXR1cmVzICk7XG4gICAgICAgICB2ZXJ0aWNlc1sgaWQgXSA9IHtcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIGxhYmVsOiBpZCxcbiAgICAgICAgICAgIGtpbmQ6IGtpbmRzWyBkZXNjcmlwdG9yLmludGVncmF0aW9uLnR5cGUgXSxcbiAgICAgICAgICAgIHBvcnRzOiBwb3J0c1xuICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gcHJvY2Vzc0NvbXBvc2l0aW9uSW5zdGFuY2UoIGNvbXBvc2l0aW9uSW5zdGFuY2UsIGFyZWFOYW1lICkge1xuICAgICAgICAgY29uc3QgeyBpZCB9ID0gY29tcG9zaXRpb25JbnN0YW5jZTtcbiAgICAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBjb21wb3NpdGlvbkRlZmluaXRpb25zWyBwYWdlUmVmZXJlbmNlIF1bIGlkIF0uQ09NUEFDVDtcblxuICAgICAgICAgY29uc3Qgc2NoZW1hID0gZGVmaW5pdGlvbi5mZWF0dXJlcy50eXBlID9cbiAgICAgICAgICAgIGRlZmluaXRpb24uZmVhdHVyZXMgOlxuICAgICAgICAgICAgeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogZGVmaW5pdGlvbi5mZWF0dXJlcyB9O1xuXG4gICAgICAgICBjb25zdCBwb3J0cyA9IGlkZW50aWZ5UG9ydHMoXG4gICAgICAgICAgICBjb21wb3NpdGlvbkluc3RhbmNlLmZlYXR1cmVzIHx8IHt9LFxuICAgICAgICAgICAgb2JqZWN0Lm9wdGlvbnMoIHNjaGVtYSApXG4gICAgICAgICApO1xuXG4gICAgICAgICB2ZXJ0aWNlc1sgaWQgXSA9IHtcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIGxhYmVsOiBpZCxcbiAgICAgICAgICAgIGtpbmQ6ICdDT01QT1NJVElPTicsXG4gICAgICAgICAgICBwb3J0czogcG9ydHNcbiAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgIGZ1bmN0aW9uIGlkZW50aWZ5UG9ydHMoIHZhbHVlLCBzY2hlbWEsIHBhdGgsIHBvcnRzICkge1xuICAgICAgICAgcGF0aCA9IHBhdGggfHwgW107XG4gICAgICAgICBwb3J0cyA9IHBvcnRzIHx8IHsgaW5ib3VuZDogW10sIG91dGJvdW5kOiBbXSB9O1xuICAgICAgICAgaWYoICF2YWx1ZSB8fCAhc2NoZW1hICkge1xuICAgICAgICAgICAgcmV0dXJuIHBvcnRzO1xuICAgICAgICAgfVxuXG4gICAgICAgICBpZiggIXNjaGVtYS50eXBlICkge1xuICAgICAgICAgICAgLy8gVE9ETzogY2xlYW51cCwgaW52ZXJ0IHJvbGVcbiAgICAgICAgICAgIHNjaGVtYSA9IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHNjaGVtYSB9O1xuICAgICAgICAgfVxuXG4gICAgICAgICBpZiggdmFsdWUuZW5hYmxlZCA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICAvLyBmZWF0dXJlIGNhbiBiZSBkaXNhYmxlZCwgYW5kIHdhcyBkaXNhYmxlZFxuICAgICAgICAgICAgcmV0dXJuIHBvcnRzO1xuICAgICAgICAgfVxuICAgICAgICAgaWYoIHNjaGVtYS50eXBlID09PSAnc3RyaW5nJyAmJiBzY2hlbWEuYXhSb2xlICYmXG4gICAgICAgICAgICAgKCBzY2hlbWEuZm9ybWF0ID09PSAndG9waWMnIHx8IHNjaGVtYS5mb3JtYXQgPT09ICdmbGFnLXRvcGljJyApICkge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IHNjaGVtYS5heFBhdHRlcm4gPyBzY2hlbWEuYXhQYXR0ZXJuLnRvVXBwZXJDYXNlKCkgOiBpbmZlckVkZ2VUeXBlKCBwYXRoICk7XG4gICAgICAgICAgICBpZiggIXR5cGUgKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgY29uc3QgZWRnZUlkID0gdHlwZSArICc6JyArIHZhbHVlO1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBwYXRoLmpvaW4oICcuJyApO1xuICAgICAgICAgICAgY29uc3QgaWQgPSAgcGF0aC5qb2luKCAnOicgKTtcbiAgICAgICAgICAgIHBvcnRzWyBzY2hlbWEuYXhSb2xlID09PSAnb3V0bGV0JyA/ICdvdXRib3VuZCcgOiAnaW5ib3VuZCcgXS5wdXNoKCB7XG4gICAgICAgICAgICAgICBsYWJlbCwgaWQsIHR5cGUsIGVkZ2VJZFxuICAgICAgICAgICAgfSApO1xuICAgICAgICAgICAgaWYoIGVkZ2VJZCAmJiAhZWRnZXNbIGVkZ2VJZCBdICkge1xuICAgICAgICAgICAgICAgZWRnZXNbIGVkZ2VJZCBdID0geyB0eXBlLCBpZDogZWRnZUlkLCBsYWJlbDogdmFsdWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgaWYoIHNjaGVtYS50eXBlID09PSAnb2JqZWN0JyAmJiBzY2hlbWEucHJvcGVydGllcyApIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKCBzY2hlbWEucHJvcGVydGllcyApLmZvckVhY2goIGtleSA9PiB7XG4gICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eVNjaGVtYSA9IHNjaGVtYS5wcm9wZXJ0aWVzWyBrZXkgXSB8fCBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICBpZGVudGlmeVBvcnRzKCB2YWx1ZVsga2V5IF0sIHByb3BlcnR5U2NoZW1hLCBwYXRoLmNvbmNhdCggWyBrZXkgXSApLCBwb3J0cyApO1xuICAgICAgICAgICAgfSApO1xuICAgICAgICAgfVxuICAgICAgICAgaWYoIHNjaGVtYS50eXBlID09PSAnYXJyYXknICkge1xuICAgICAgICAgICAgdmFsdWUuZm9yRWFjaCggKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgICAgIGlkZW50aWZ5UG9ydHMoIGl0ZW0sIHNjaGVtYS5pdGVtcywgcGF0aC5jb25jYXQoIFsgaSBdICksIHBvcnRzICk7XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICB9XG4gICAgICAgICByZXR1cm4gcG9ydHM7XG4gICAgICB9XG5cbiAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgIGZ1bmN0aW9uIGluZmVyRWRnZVR5cGUoIHBhdGggKSB7XG4gICAgICAgICBpZiggIXBhdGgubGVuZ3RoICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICB9XG4gICAgICAgICBjb25zdCBsYXN0U2VnbWVudCA9IHBhdGhbIHBhdGgubGVuZ3RoIC0gMSBdO1xuICAgICAgICAgaWYoIFsgJ2FjdGlvbicsICdmbGFnJywgJ3Jlc291cmNlJyBdLmluZGV4T2YoIGxhc3RTZWdtZW50ICkgIT09IC0xICkge1xuICAgICAgICAgICAgcmV0dXJuIGxhc3RTZWdtZW50LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICB9XG4gICAgICAgICBpZiggbGFzdFNlZ21lbnQgPT09ICdvbkFjdGlvbnMnICkge1xuICAgICAgICAgICAgcmV0dXJuICdBQ1RJT04nO1xuICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGluZmVyRWRnZVR5cGUoIHBhdGguc2xpY2UoIDAsIHBhdGgubGVuZ3RoIC0gMSApICk7XG4gICAgICB9XG5cbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gaWRlbnRpZnlDb250YWluZXJzKCkge1xuICAgICAgY29uc3QgdHlwZSA9IFRZUEVfQ09OVEFJTkVSO1xuXG4gICAgICBPYmplY3Qua2V5cyggcGFnZS5hcmVhcyApLmZvckVhY2goIGFyZWFOYW1lID0+IHtcbiAgICAgICAgIGluc2VydEVkZ2UoIGFyZWFOYW1lICk7XG4gICAgICAgICBjb25zdCBvd25lciA9IGZpbmRPd25lciggYXJlYU5hbWUgKTtcbiAgICAgICAgIGlmKCAhb3duZXIgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICB9XG5cbiAgICAgICAgIGxldCBjb250YWluc0FueXRoaW5nID0gZmFsc2U7XG4gICAgICAgICBwYWdlLmFyZWFzWyBhcmVhTmFtZSBdXG4gICAgICAgICAgICAuZmlsdGVyKCBpdGVtID0+IHtcbiAgICAgICAgICAgICAgIHJldHVybiBpc0NvbXBvc2l0aW9uKCBpdGVtICkgP1xuICAgICAgICAgICAgICAgICAgY29tcG9zaXRpb25EaXNwbGF5ID09PSAnQ09NUEFDVCcgOlxuICAgICAgICAgICAgICAgICAgdHJ1ZTtcbiAgICAgICAgICAgIH0gKVxuICAgICAgICAgICAgLmZvckVhY2goIGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgaWYoIHZlcnRpY2VzWyBpdGVtLmlkIF0gKSB7XG4gICAgICAgICAgICAgICAgICBpbnNlcnRVcGxpbmsoIHZlcnRpY2VzWyBpdGVtLmlkIF0sIGFyZWFOYW1lICk7XG4gICAgICAgICAgICAgICAgICBjb250YWluc0FueXRoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgIGlmKCBjb250YWluc0FueXRoaW5nICkge1xuICAgICAgICAgICAgaW5zZXJ0T3duZXJQb3J0KCBvd25lciwgYXJlYU5hbWUgKTtcbiAgICAgICAgIH1cbiAgICAgIH0gKTtcblxuICAgICAgZnVuY3Rpb24gZmluZE93bmVyKCBhcmVhTmFtZSApIHtcbiAgICAgICAgIGlmKCBhcmVhTmFtZS5pbmRleE9mKCAnLicgKSA8PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuIHZlcnRpY2VzWyBST09UX0lEIF07XG4gICAgICAgICB9XG4gICAgICAgICBjb25zdCBwcmVmaXggPSBhcmVhTmFtZS5zbGljZSggMCwgYXJlYU5hbWUubGFzdEluZGV4T2YoICcuJyApICk7XG4gICAgICAgICByZXR1cm4gdmVydGljZXNbIHByZWZpeCBdO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBpbnNlcnRPd25lclBvcnQoIHZlcnRleCwgYXJlYU5hbWUgKSB7XG4gICAgICAgICB2ZXJ0ZXgucG9ydHMub3V0Ym91bmQudW5zaGlmdCgge1xuICAgICAgICAgICAgaWQ6ICdDT05UQUlORVI6JyArIGFyZWFOYW1lLFxuICAgICAgICAgICAgdHlwZTogVFlQRV9DT05UQUlORVIsXG4gICAgICAgICAgICBlZGdlSWQ6IGFyZWFFZGdlSWQoIGFyZWFOYW1lICksXG4gICAgICAgICAgICBsYWJlbDogYXJlYU5hbWVcbiAgICAgICAgIH0gKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaW5zZXJ0VXBsaW5rKCB2ZXJ0ZXgsIGFyZWFOYW1lICkge1xuICAgICAgICAgdmVydGV4LnBvcnRzLmluYm91bmQudW5zaGlmdCgge1xuICAgICAgICAgICAgaWQ6ICdDT05UQUlORVI6YW5jaG9yJyxcbiAgICAgICAgICAgIHR5cGU6IFRZUEVfQ09OVEFJTkVSLFxuICAgICAgICAgICAgZWRnZUlkOiBhcmVhRWRnZUlkKCBhcmVhTmFtZSApLFxuICAgICAgICAgICAgbGFiZWw6ICdhbmNob3InXG4gICAgICAgICB9ICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGluc2VydEVkZ2UoIGFyZWFOYW1lICkge1xuICAgICAgICAgY29uc3QgaWQgPSBhcmVhRWRnZUlkKCBhcmVhTmFtZSApO1xuICAgICAgICAgZWRnZXNbIGlkIF0gPSB7IGlkLCB0eXBlLCBsYWJlbDogYXJlYU5hbWUgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYXJlYUVkZ2VJZCggYXJlYU5hbWUgKSB7XG4gICAgICAgICByZXR1cm4gVFlQRV9DT05UQUlORVIgKyAnOicgKyBhcmVhTmFtZTtcbiAgICAgIH1cbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gcHJ1bmVJcnJlbGV2YW50V2lkZ2V0cyggd2l0aENvbnRhaW5lcnMgKSB7XG4gICAgICBsZXQgdG9QcnVuZSA9IFtdO1xuICAgICAgZG8ge1xuICAgICAgICAgdG9QcnVuZS5mb3JFYWNoKCBpZCA9PiB7IGRlbGV0ZSB2ZXJ0aWNlc1sgaWQgXTsgfSApO1xuICAgICAgICAgcHJ1bmVFbXB0eUVkZ2VzKCk7XG4gICAgICAgICB0b1BydW5lID0gbWFyaygpO1xuICAgICAgfSB3aGlsZSggdG9QcnVuZS5sZW5ndGggKTtcblxuICAgICAgZnVuY3Rpb24gbWFyaygpIHtcbiAgICAgICAgIGNvbnN0IHBydW5lTGlzdCA9IFtdO1xuICAgICAgICAgT2JqZWN0LmtleXMoIHZlcnRpY2VzICkuZm9yRWFjaCggdklkID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvcnRzID0gdmVydGljZXNbIHZJZCBdLnBvcnRzO1xuICAgICAgICAgICAgaWYoIHBvcnRzLmluYm91bmQubGVuZ3RoIDw9IHdpdGhDb250YWluZXJzID8gMSA6IDAgKSB7XG4gICAgICAgICAgICAgICBpZiggcG9ydHMub3V0Ym91bmQuZXZlcnkoIF8gPT4gIV8uZWRnZUlkICkgKSB7XG4gICAgICAgICAgICAgICAgICBwcnVuZUxpc3QucHVzaCggdklkICApO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgfSApO1xuICAgICAgICAgcmV0dXJuIHBydW5lTGlzdDtcbiAgICAgIH1cbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gcHJ1bmVFbXB0eUVkZ2VzKCkge1xuICAgICAgY29uc3QgdG9QcnVuZSA9IFtdO1xuICAgICAgT2JqZWN0LmtleXMoIGVkZ2VzICkuZm9yRWFjaCggZWRnZUlkID0+IHtcbiAgICAgICAgIGNvbnN0IHR5cGUgPSBlZGdlVHlwZXNbIGVkZ2VzWyBlZGdlSWQgXS50eXBlIF07XG4gICAgICAgICBjb25zdCBzb3VyY2VzID0gT2JqZWN0LmtleXMoIHZlcnRpY2VzICkuZmlsdGVyKCBpc1NvdXJjZU9mKCBlZGdlSWQgKSApO1xuICAgICAgICAgY29uc3Qgc2lua3MgPSBPYmplY3Qua2V5cyggdmVydGljZXMgKS5maWx0ZXIoIGlzU2lua09mKCBlZGdlSWQgKSApO1xuICAgICAgICAgY29uc3QgaGFzU291cmNlcyA9IHNvdXJjZXMubGVuZ3RoID4gMDtcbiAgICAgICAgIGNvbnN0IGhhc1NpbmtzID0gc2lua3MubGVuZ3RoID4gMDtcbiAgICAgICAgIGNvbnN0IGlzRW1wdHkgPSB0eXBlLm93bmluZ1BvcnQgPyAoIWhhc1NvdXJjZXMgfHwgIWhhc1NpbmtzKSA6ICghaGFzU291cmNlcyAmJiAhaGFzU2lua3MpO1xuICAgICAgICAgaWYoICFpc0VtcHR5ICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgfVxuXG4gICAgICAgICB0b1BydW5lLnB1c2goIGVkZ2VJZCApO1xuICAgICAgICAgc291cmNlcy5jb25jYXQoIHNpbmtzICkuZm9yRWFjaCggdmVydGV4SWQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcG9ydHMgPSB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5wb3J0cztcbiAgICAgICAgICAgIHBvcnRzLmluYm91bmQuY29uY2F0KCBwb3J0cy5vdXRib3VuZCApLmZvckVhY2goIHBvcnQgPT4ge1xuICAgICAgICAgICAgICAgcG9ydC5lZGdlSWQgPSBwb3J0LmVkZ2VJZCA9PT0gZWRnZUlkID8gbnVsbCA6IHBvcnQuZWRnZUlkO1xuICAgICAgICAgICAgfSApO1xuICAgICAgICAgfSApO1xuICAgICAgfSApO1xuICAgICAgdG9QcnVuZS5mb3JFYWNoKCBpZCA9PiB7IGRlbGV0ZSBlZGdlc1sgaWQgXTsgfSApO1xuXG4gICAgICBmdW5jdGlvbiBpc1NvdXJjZU9mKCBlZGdlSWQgKSB7XG4gICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHZlcnRleElkICkge1xuICAgICAgICAgICAgcmV0dXJuIHZlcnRpY2VzWyB2ZXJ0ZXhJZCBdLnBvcnRzLmluYm91bmQuc29tZSggcG9ydCA9PiBwb3J0LmVkZ2VJZCA9PT0gZWRnZUlkICk7XG4gICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBpc1NpbmtPZiggZWRnZUlkICkge1xuICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCB2ZXJ0ZXhJZCApIHtcbiAgICAgICAgICAgIHJldHVybiB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5wb3J0cy5vdXRib3VuZC5zb21lKCBwb3J0ID0+IHBvcnQuZWRnZUlkID09PSBlZGdlSWQgKTtcbiAgICAgICAgIH07XG4gICAgICB9XG4gICB9XG5cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gaXNDb21wb3NpdGlvbiggcGFnZUFyZWFJdGVtICkge1xuICAgcmV0dXJuICEhcGFnZUFyZWFJdGVtLmNvbXBvc2l0aW9uO1xufVxuXG5mdW5jdGlvbiBpc1dpZGdldCggcGFnZUFyZWFJdGVtICkge1xuICAgcmV0dXJuICEhcGFnZUFyZWFJdGVtLndpZGdldDtcbn1cblxuZnVuY3Rpb24gaXNMYXlvdXQoIHBhZ2VBcmVhSXRlbSApIHtcbiAgIHJldHVybiAhIXBhZ2VBcmVhSXRlbS5sYXlvdXQ7XG59XG5cbmZ1bmN0aW9uIGVpdGhlciggZiwgZyApIHtcbiAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKSB8fCBnLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBsYXlvdXQoIGdyYXBoICkge1xuICAgcmV0dXJuIGxheW91dE1vZGVsLmNvbnZlcnQubGF5b3V0KCB7XG4gICAgICB2ZXJ0aWNlczoge30sXG4gICAgICBlZGdlczoge31cbiAgIH0gKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIHR5cGVzKCkge1xuICAgcmV0dXJuIGdyYXBoTW9kZWwuY29udmVydC50eXBlcyggZWRnZVR5cGVzICk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NpdGlvblN0YWNrKCBjb21wb3NpdGlvbkluc3RhbmNlSWQgKSB7XG4gICByZXR1cm4gW107XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJGcm9tU2VsZWN0aW9uKCBzZWxlY3Rpb24sIGdyYXBoTW9kZWwgKSB7XG4gICBjb25zdCB0b3BpY3MgPSBzZWxlY3Rpb24uZWRnZXMuZmxhdE1hcCggZWRnZUlkID0+IHtcbiAgICAgIGNvbnN0IFsgdHlwZSwgdG9waWMgXSA9IGVkZ2VJZC5zcGxpdCggJzonICk7XG4gICAgICByZXR1cm4gKCB0eXBlID09PSAnQ09OVEFJTkVSJyApID8gW10gOiBbeyBwYXR0ZXJuOiB0eXBlLCB0b3BpYyB9XTtcbiAgIH0gKS50b0pTKCk7XG5cbiAgIGNvbnN0IHBhcnRpY2lwYW50cyA9IHNlbGVjdGlvbi52ZXJ0aWNlcy5mbGF0TWFwKCB2ZXJ0ZXhJZCA9PiB7XG4gICAgICBjb25zdCB7IGlkLCBraW5kIH0gPSBncmFwaE1vZGVsLnZlcnRpY2VzLmdldCggdmVydGV4SWQgKTtcbiAgICAgIHJldHVybiAoIGtpbmQgPT09ICdQQUdFJyB8fCBraW5kID09PSAnTEFZT1VUJyApID8gW10gOiBbeyBraW5kLCBwYXJ0aWNpcGFudDogdmVydGV4SWQgfV07XG4gICB9ICk7XG5cbiAgIHJldHVybiB7XG4gICAgICB0b3BpY3MsXG4gICAgICBwYXJ0aWNpcGFudHNcbiAgIH07XG59XG4iXX0=
