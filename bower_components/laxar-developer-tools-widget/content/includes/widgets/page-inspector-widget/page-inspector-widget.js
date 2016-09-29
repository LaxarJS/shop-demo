/* jshint ignore:start */
define(['exports', 'module', 'react', 'laxar-patterns', 'wireflow', './graph-helpers'], function (exports, module, _react, _laxarPatterns, _wireflow, _graphHelpers) {/**
                                                                                                                                                                       * Copyright 2016 aixigo AG
                                                                                                                                                                       * Released under the MIT license.
                                                                                                                                                                       * http://laxarjs.org/license
                                                                                                                                                                       */'use strict';function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}var _React = _interopRequireDefault(_react);var _patterns = _interopRequireDefault(_laxarPatterns);var _wireflow2 = _interopRequireDefault(_wireflow);var 








   SelectionStore = _wireflow2['default'].selection.SelectionStore;var 
   HistoryStore = _wireflow2['default'].history.HistoryStore;var 
   LayoutStore = _wireflow2['default'].layout.LayoutStore;var _wireflow$graph = _wireflow2['default'].
   graph;var GraphStore = _wireflow$graph.GraphStore;var ActivateVertex = _wireflow$graph.actions.ActivateVertex;var _wireflow$settings = _wireflow2['default'].
   settings;var _wireflow$settings$actions = _wireflow$settings.
   actions;var ChangeMode = _wireflow$settings$actions.ChangeMode;var MinimapResized = _wireflow$settings$actions.MinimapResized;var _wireflow$settings$model = _wireflow$settings.
   model;var Settings = _wireflow$settings$model.Settings;var READ_ONLY = _wireflow$settings$model.READ_ONLY;var READ_WRITE = _wireflow$settings$model.READ_WRITE;var 
   SettingsStore = _wireflow$settings.SettingsStore;var 

   Dispatcher = _wireflow2['default'].Dispatcher;var 
   Graph = _wireflow2['default'].components.Graph;



   function create(context, eventBus, reactRender) {

      var visible = false;
      var domAvailable = false;
      var viewModel = null;
      var viewModelCalculation = null;

      var withIrrelevantWidgets = false;
      var withContainers = true;
      var withFlatCompositions = false;

      var compositionStack = [];
      var activeComposition = null;

      var publishedSelection = null;

      _patterns['default'].resources.handlerFor(context).
      registerResourceFromFeature('pageInfo', { 
         onUpdateReplace: function onUpdateReplace() {return initializeViewModel(true);} });



      var publishFilter = _patterns['default'].resources.replacePublisherForFeature(context, 'filter', { 
         isOptional: true });


      eventBus.subscribe('didChangeAreaVisibility.' + context.widget.area, function (event, meta) {
         if (!visible && event.visible) {
            visible = true;
            render();}});



      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function replaceFilter(selection, graphModel) {
         var resource = context.features.filter.resource;
         if (!resource || selection === publishedSelection) {
            return;}

         publishedSelection = selection;
         publishFilter((0, _graphHelpers.filterFromSelection)(selection, graphModel));}


      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function toggleIrrelevantWidgets() {
         withIrrelevantWidgets = !withIrrelevantWidgets;
         initializeViewModel(true);}


      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function toggleContainers() {
         withContainers = !withContainers;
         initializeViewModel(true);}


      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function toggleCompositions() {
         withFlatCompositions = !withFlatCompositions;
         initializeViewModel(true);}


      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function enterCompositionInstance(id) {
         if (id === _graphHelpers.ROOT_ID) {
            id = compositionStack.length > 1 ? compositionStack[compositionStack.length - 2] : null;}

         var goToTop = id === null;
         var targetIndex = goToTop ? 0 : compositionStack.indexOf(id);
         if (targetIndex === -1) {
            compositionStack.push(id);} else 

         {
            compositionStack.splice(goToTop ? 0 : targetIndex + 1, compositionStack.length - targetIndex);}

         activeComposition = id;
         initializeViewModel(true);}


      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function initializeViewModel(doReset) {
         if (doReset) {
            viewModel = null;
            clearTimeout(viewModelCalculation);
            viewModelCalculation = null;
            if (visible) {
               render();}}



         if (visible) {
            // setTimeout: used to ensure that the browser shows the spinner before stalling for layout
            viewModelCalculation = viewModelCalculation || setTimeout(function () {
               var pageTypes = (0, _graphHelpers.types)();
               var pageInfo = context.resources.pageInfo;
               var pageGraph = (0, _graphHelpers.graph)(pageInfo, { 
                  withIrrelevantWidgets: withIrrelevantWidgets, 
                  withContainers: withContainers, 
                  compositionDisplay: withFlatCompositions ? 'FLAT' : 'COMPACT', 
                  activeComposition: activeComposition });

               var dispatcher = new Dispatcher(render);
               new HistoryStore(dispatcher);
               var graphStore = new GraphStore(dispatcher, pageGraph, pageTypes);
               var layoutStore = new LayoutStore(dispatcher, graphStore);
               var settingsStore = new SettingsStore(dispatcher, Settings({ mode: READ_ONLY }));
               var selectionStore = new SelectionStore(dispatcher, layoutStore, graphStore);

               dispatcher.register(ActivateVertex, function (_ref) {var vertex = _ref.vertex;
                  if (vertex.kind === 'COMPOSITION' || vertex.kind === 'PAGE') {
                     enterCompositionInstance(vertex.id);}});



               viewModel = { graphStore: graphStore, layoutStore: layoutStore, settingsStore: settingsStore, selectionStore: selectionStore, dispatcher: dispatcher };
               render();}, 
            20);}}



      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      function render() {
         if (!visible || !domAvailable) {
            return;}


         if (!viewModel) {
            reactRender(
            _React['default'].createElement('div', { className: 'page-inspector-placeholder' }, 
            _React['default'].createElement('i', { className: 'fa fa-cog fa-spin' })));


            initializeViewModel();
            return;}var _viewModel = 








         viewModel;var graphStore = _viewModel.graphStore;var layoutStore = _viewModel.layoutStore;var settingsStore = _viewModel.settingsStore;var selectionStore = _viewModel.selectionStore;var dispatcher = _viewModel.dispatcher;

         replaceFilter(selectionStore.selection, graphStore.graph);


         reactRender(
         _React['default'].createElement('div', { className: 'page-inspector-row form-inline' }, 
         _React['default'].createElement('div', { className: 'text-right' }, 
         _React['default'].createElement('div', { className: 'pull-left' }, renderBreadCrumbs()), 
         _React['default'].createElement('button', { type: 'button', className: 'btn btn-link ', 
            title: 'Include widgets without any links to relevant topics?', 
            onClick: toggleIrrelevantWidgets }, 
         _React['default'].createElement('i', { className: 'fa fa-toggle-' + (withIrrelevantWidgets ? 'on' : 'off') }), ' ', 
         _React['default'].createElement('span', null, 'Isolated Widgets')), 
         _React['default'].createElement('button', { type: 'button', className: 'btn btn-link', 
            title: 'Include area-nesting relationships?', 
            onClick: toggleContainers }, 
         _React['default'].createElement('i', { className: 'fa fa-toggle-' + (withContainers ? 'on' : 'off') }), ' ', 
         _React['default'].createElement('span', null, 'Containers')), 
         _React['default'].createElement('button', { type: 'button', className: 'btn btn-link', 
            title: 'Flatten compositions into their runtime contents?', 
            onClick: toggleCompositions }, 
         _React['default'].createElement('i', { className: 'fa fa-toggle-' + (withFlatCompositions ? 'on' : 'off') }), ' ', 
         _React['default'].createElement('span', null, 'Flatten Compositions'))), 

         _React['default'].createElement(Graph, { className: 'nbe-theme-fusebox-app', 
            types: graphStore.types, 
            model: graphStore.graph, 
            layout: layoutStore.layout, 
            measurements: layoutStore.measurements, 
            settings: settingsStore.settings, 
            selection: selectionStore.selection, 
            eventHandler: dispatcher.dispatch })));



         function renderBreadCrumbs() {
            return [
            _React['default'].createElement('button', { key: _graphHelpers.ROOT_ID, type: 'button', className: 'btn btn-link page-inspector-breadcrumb', 
               onClick: function () {return enterCompositionInstance(null);} }, 
            _React['default'].createElement('i', { className: 'fa fa-home' }))].

            concat(compositionStack.map(function (id) {return (
                  activeComposition === id ? id : 
                  _React['default'].createElement('button', { key: id, type: 'button', className: 'btn btn-link page-inspector-breadcrumb', 
                     onClick: function () {return enterCompositionInstance(id);} }, id));}));}}




      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      return { onDomAvailable: function onDomAvailable() {
            domAvailable = true;
            render();} };}module.exports = 



   { 
      name: 'page-inspector-widget', 
      injections: ['axContext', 'axEventBus', 'axReactRender'], 
      create: create };});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhZ2UtaW5zcGVjdG9yLXdpZGdldC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWFlLGlCQUFjLHlCQUEzQixTQUFTLENBQUksY0FBYztBQUNoQixlQUFZLHlCQUF2QixPQUFPLENBQUksWUFBWTtBQUNiLGNBQVcseUJBQXJCLE1BQU0sQ0FBSSxXQUFXO0FBQ3JCLFFBQUssS0FBSSxVQUFVLG1CQUFWLFVBQVUsS0FBYSxjQUFjLG1CQUF6QixPQUFPLENBQUksY0FBYztBQUM5QyxXQUFRO0FBQ04sVUFBTyxLQUFJLFVBQVUsOEJBQVYsVUFBVSxLQUFFLGNBQWMsOEJBQWQsY0FBYztBQUNyQyxRQUFLLEtBQUksUUFBUSw0QkFBUixRQUFRLEtBQUUsU0FBUyw0QkFBVCxTQUFTLEtBQUUsVUFBVSw0QkFBVixVQUFVO0FBQ3hDLGdCQUFhLHNCQUFiLGFBQWE7O0FBRWYsYUFBVSx5QkFBVixVQUFVO0FBQ0ksUUFBSyx5QkFBbkIsVUFBVSxDQUFJLEtBQUs7Ozs7QUFJckIsWUFBUyxNQUFNLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUc7O0FBRS9DLFVBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNwQixVQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDekIsVUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFVBQUksb0JBQW9CLEdBQUcsSUFBSSxDQUFDOztBQUVoQyxVQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FBQztBQUNsQyxVQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDMUIsVUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7O0FBRWpDLFVBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzFCLFVBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDOztBQUU3QixVQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQzs7QUFFOUIsMkJBQVMsU0FBUyxDQUFDLFVBQVUsQ0FBRSxPQUFPLENBQUU7QUFDcEMsaUNBQTJC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QUFBQztBQUN0RCxtREFBRyxTQUFTLEVBQUMsWUFBWSxHQUFLLENBQ3hCLENBQ1Y7O0FBQUMsa0JBQU0sQ0FBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsVUFBQSxFQUFFO0FBQy9CLG1DQUFpQixLQUFLLEVBQUUsR0FBRyxFQUFFO0FBQzFCLDhEQUFRLEdBQUcsRUFBRSxFQUFFLEFBQUMsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyx3Q0FBd0M7QUFDekUsNEJBQU8sRUFBRSxvQkFBTSx3QkFBd0IsQ0FBRSxFQUFFLENBQUUsRUFBQSxBQUFDLElBQUcsRUFBRSxDQUFXLEdBQUEsQ0FDNUUsQ0FBRSxDQUFDLENBQ0wsQ0FDSDs7Ozs7OztBQUlELGFBQU8sRUFBRSxjQUFjLEVBQUUsMEJBQU07QUFDNUIsd0JBQVksR0FBRyxJQUFJLENBQUM7QUFDcEIsa0JBQU0sRUFBRSxDQUFDLENBQ1gsRUFBRSxDQUFDLENBQ047Ozs7QUFFYztBQUNaLFVBQUksRUFBRSx1QkFBdUI7QUFDN0IsZ0JBQVUsRUFBRSxDQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFFO0FBQzFELFlBQU0sRUFBTixNQUFNLEVBQ1IiLCJmaWxlIjoicGFnZS1pbnNwZWN0b3Itd2lkZ2V0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNiBhaXhpZ28gQUdcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqIGh0dHA6Ly9sYXhhcmpzLm9yZy9saWNlbnNlXG4gKi9cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgcGF0dGVybnMgZnJvbSAnbGF4YXItcGF0dGVybnMnO1xuXG5pbXBvcnQgd2lyZWZsb3cgZnJvbSAnd2lyZWZsb3cnO1xuXG5pbXBvcnQgeyB0eXBlcywgZ3JhcGgsIGxheW91dCwgZmlsdGVyRnJvbVNlbGVjdGlvbiwgUk9PVF9JRCB9IGZyb20gJy4vZ3JhcGgtaGVscGVycyc7XG5cbmNvbnN0IHtcbiAgc2VsZWN0aW9uOiB7IFNlbGVjdGlvblN0b3JlIH0sXG4gIGhpc3Rvcnk6IHsgSGlzdG9yeVN0b3JlIH0sXG4gIGxheW91dDogeyBMYXlvdXRTdG9yZSB9LFxuICBncmFwaDogeyBHcmFwaFN0b3JlLCBhY3Rpb25zOiB7IEFjdGl2YXRlVmVydGV4IH0gfSxcbiAgc2V0dGluZ3M6IHtcbiAgICBhY3Rpb25zOiB7IENoYW5nZU1vZGUsIE1pbmltYXBSZXNpemVkIH0sXG4gICAgbW9kZWw6IHsgU2V0dGluZ3MsIFJFQURfT05MWSwgUkVBRF9XUklURSB9LFxuICAgIFNldHRpbmdzU3RvcmVcbiAgfSxcbiAgRGlzcGF0Y2hlcixcbiAgY29tcG9uZW50czogeyBHcmFwaCB9XG59ID0gd2lyZWZsb3c7XG5cblxuZnVuY3Rpb24gY3JlYXRlKCBjb250ZXh0LCBldmVudEJ1cywgcmVhY3RSZW5kZXIgKSB7XG5cbiAgIGxldCB2aXNpYmxlID0gZmFsc2U7XG4gICBsZXQgZG9tQXZhaWxhYmxlID0gZmFsc2U7XG4gICBsZXQgdmlld01vZGVsID0gbnVsbDtcbiAgIGxldCB2aWV3TW9kZWxDYWxjdWxhdGlvbiA9IG51bGw7XG5cbiAgIGxldCB3aXRoSXJyZWxldmFudFdpZGdldHMgPSBmYWxzZTtcbiAgIGxldCB3aXRoQ29udGFpbmVycyA9IHRydWU7XG4gICBsZXQgd2l0aEZsYXRDb21wb3NpdGlvbnMgPSBmYWxzZTtcblxuICAgbGV0IGNvbXBvc2l0aW9uU3RhY2sgPSBbXTtcbiAgIGxldCBhY3RpdmVDb21wb3NpdGlvbiA9IG51bGw7XG5cbiAgIGxldCBwdWJsaXNoZWRTZWxlY3Rpb24gPSBudWxsO1xuXG4gICBwYXR0ZXJucy5yZXNvdXJjZXMuaGFuZGxlckZvciggY29udGV4dCApXG4gICAgICAucmVnaXN0ZXJSZXNvdXJjZUZyb21GZWF0dXJlKCAncGFnZUluZm8nLCB7XG4gICAgICAgICBvblVwZGF0ZVJlcGxhY2U6ICgpID0+IGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKVxuICAgICAgfSApO1xuXG5cbiAgIGNvbnN0IHB1Ymxpc2hGaWx0ZXIgPSBwYXR0ZXJucy5yZXNvdXJjZXMucmVwbGFjZVB1Ymxpc2hlckZvckZlYXR1cmUoIGNvbnRleHQsICdmaWx0ZXInLCB7XG4gICAgICBpc09wdGlvbmFsOiB0cnVlXG4gICB9ICk7XG5cbiAgIGV2ZW50QnVzLnN1YnNjcmliZSggYGRpZENoYW5nZUFyZWFWaXNpYmlsaXR5LiR7Y29udGV4dC53aWRnZXQuYXJlYX1gLCAoZXZlbnQsIG1ldGEpID0+IHtcbiAgICAgIGlmKCAhdmlzaWJsZSAmJiBldmVudC52aXNpYmxlICkge1xuICAgICAgICAgdmlzaWJsZSA9IHRydWU7XG4gICAgICAgICByZW5kZXIoKTtcbiAgICAgIH1cbiAgIH0gKTtcblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiByZXBsYWNlRmlsdGVyKCBzZWxlY3Rpb24sIGdyYXBoTW9kZWwgKSB7XG4gICAgICBjb25zdCByZXNvdXJjZSA9IGNvbnRleHQuZmVhdHVyZXMuZmlsdGVyLnJlc291cmNlO1xuICAgICAgaWYoICFyZXNvdXJjZSB8fCBzZWxlY3Rpb24gPT09IHB1Ymxpc2hlZFNlbGVjdGlvbiApIHtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHB1Ymxpc2hlZFNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgIHB1Ymxpc2hGaWx0ZXIoIGZpbHRlckZyb21TZWxlY3Rpb24oIHNlbGVjdGlvbiwgZ3JhcGhNb2RlbCApICk7XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gdG9nZ2xlSXJyZWxldmFudFdpZGdldHMoKSB7XG4gICAgICB3aXRoSXJyZWxldmFudFdpZGdldHMgPSAhd2l0aElycmVsZXZhbnRXaWRnZXRzO1xuICAgICAgaW5pdGlhbGl6ZVZpZXdNb2RlbCggdHJ1ZSApO1xuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIHRvZ2dsZUNvbnRhaW5lcnMoKSB7XG4gICAgICB3aXRoQ29udGFpbmVycyA9ICF3aXRoQ29udGFpbmVycztcbiAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKTtcbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiB0b2dnbGVDb21wb3NpdGlvbnMoKSB7XG4gICAgICB3aXRoRmxhdENvbXBvc2l0aW9ucyA9ICF3aXRoRmxhdENvbXBvc2l0aW9ucztcbiAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKTtcbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiBlbnRlckNvbXBvc2l0aW9uSW5zdGFuY2UoIGlkICkge1xuICAgICAgaWYoIGlkID09PSBST09UX0lEICkge1xuICAgICAgICAgaWQgPSBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCA+IDEgPyBjb21wb3NpdGlvblN0YWNrWyBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCAtIDIgXSA6IG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBnb1RvVG9wID0gaWQgPT09IG51bGw7XG4gICAgICBjb25zdCB0YXJnZXRJbmRleCA9IGdvVG9Ub3AgPyAwIDogY29tcG9zaXRpb25TdGFjay5pbmRleE9mKCBpZCApO1xuICAgICAgaWYoIHRhcmdldEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgIGNvbXBvc2l0aW9uU3RhY2sucHVzaCggaWQgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgY29tcG9zaXRpb25TdGFjay5zcGxpY2UoIGdvVG9Ub3AgPyAwIDogdGFyZ2V0SW5kZXggKyAxLCBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCAtIHRhcmdldEluZGV4ICk7XG4gICAgICB9XG4gICAgICBhY3RpdmVDb21wb3NpdGlvbiA9IGlkO1xuICAgICAgaW5pdGlhbGl6ZVZpZXdNb2RlbCggdHJ1ZSApO1xuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIGluaXRpYWxpemVWaWV3TW9kZWwoIGRvUmVzZXQgKSB7XG4gICAgICBpZiggZG9SZXNldCApIHtcbiAgICAgICAgIHZpZXdNb2RlbCA9IG51bGw7XG4gICAgICAgICBjbGVhclRpbWVvdXQoIHZpZXdNb2RlbENhbGN1bGF0aW9uICk7XG4gICAgICAgICB2aWV3TW9kZWxDYWxjdWxhdGlvbiA9IG51bGw7XG4gICAgICAgICBpZiggdmlzaWJsZSApIHtcbiAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiggdmlzaWJsZSApIHtcbiAgICAgICAgIC8vIHNldFRpbWVvdXQ6IHVzZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGJyb3dzZXIgc2hvd3MgdGhlIHNwaW5uZXIgYmVmb3JlIHN0YWxsaW5nIGZvciBsYXlvdXRcbiAgICAgICAgIHZpZXdNb2RlbENhbGN1bGF0aW9uID0gdmlld01vZGVsQ2FsY3VsYXRpb24gfHwgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFnZVR5cGVzID0gdHlwZXMoKTtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VJbmZvID0gY29udGV4dC5yZXNvdXJjZXMucGFnZUluZm87XG4gICAgICAgICAgICBjb25zdCBwYWdlR3JhcGggPSBncmFwaCggcGFnZUluZm8sIHtcbiAgICAgICAgICAgICAgIHdpdGhJcnJlbGV2YW50V2lkZ2V0cyxcbiAgICAgICAgICAgICAgIHdpdGhDb250YWluZXJzLFxuICAgICAgICAgICAgICAgY29tcG9zaXRpb25EaXNwbGF5OiB3aXRoRmxhdENvbXBvc2l0aW9ucyA/ICdGTEFUJyA6ICdDT01QQUNUJyxcbiAgICAgICAgICAgICAgIGFjdGl2ZUNvbXBvc2l0aW9uXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICAgICBjb25zdCBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoIHJlbmRlciApO1xuICAgICAgICAgICAgbmV3IEhpc3RvcnlTdG9yZSggZGlzcGF0Y2hlciApO1xuICAgICAgICAgICAgY29uc3QgZ3JhcGhTdG9yZSA9IG5ldyBHcmFwaFN0b3JlKCBkaXNwYXRjaGVyLCBwYWdlR3JhcGgsIHBhZ2VUeXBlcyApO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0U3RvcmUgPSBuZXcgTGF5b3V0U3RvcmUoIGRpc3BhdGNoZXIsIGdyYXBoU3RvcmUgKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBuZXcgU2V0dGluZ3NTdG9yZSggZGlzcGF0Y2hlciwgU2V0dGluZ3MoeyBtb2RlOiBSRUFEX09OTFkgfSkgKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvblN0b3JlID0gbmV3IFNlbGVjdGlvblN0b3JlKCBkaXNwYXRjaGVyLCBsYXlvdXRTdG9yZSwgZ3JhcGhTdG9yZSApO1xuXG4gICAgICAgICAgICBkaXNwYXRjaGVyLnJlZ2lzdGVyKCBBY3RpdmF0ZVZlcnRleCwgKHsgdmVydGV4IH0pID0+IHtcbiAgICAgICAgICAgICAgIGlmKCB2ZXJ0ZXgua2luZCA9PT0gJ0NPTVBPU0lUSU9OJyB8fCB2ZXJ0ZXgua2luZCA9PT0gJ1BBR0UnICkge1xuICAgICAgICAgICAgICAgICAgZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCB2ZXJ0ZXguaWQgKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgdmlld01vZGVsID0geyBncmFwaFN0b3JlLCBsYXlvdXRTdG9yZSwgc2V0dGluZ3NTdG9yZSwgc2VsZWN0aW9uU3RvcmUsIGRpc3BhdGNoZXIgfTtcbiAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgfSwgMjAgKTtcbiAgICAgIH1cbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICBpZiggIXZpc2libGUgfHwgIWRvbUF2YWlsYWJsZSApIHtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoICF2aWV3TW9kZWwgKSB7XG4gICAgICAgICByZWFjdFJlbmRlcihcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYWdlLWluc3BlY3Rvci1wbGFjZWhvbGRlcic+XG4gICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT0nZmEgZmEtY29nIGZhLXNwaW4nPjwvaT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgKTtcbiAgICAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoKTtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICAgZ3JhcGhTdG9yZSxcbiAgICAgICAgIGxheW91dFN0b3JlLFxuICAgICAgICAgc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgIHNlbGVjdGlvblN0b3JlLFxuICAgICAgICAgZGlzcGF0Y2hlclxuICAgICAgfSA9IHZpZXdNb2RlbDtcblxuICAgICAgcmVwbGFjZUZpbHRlciggc2VsZWN0aW9uU3RvcmUuc2VsZWN0aW9uLCBncmFwaFN0b3JlLmdyYXBoICk7XG5cblxuICAgICAgcmVhY3RSZW5kZXIoXG4gICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFnZS1pbnNwZWN0b3Itcm93IGZvcm0taW5saW5lJz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSd0ZXh0LXJpZ2h0Jz5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwdWxsLWxlZnQnPnsgcmVuZGVyQnJlYWRDcnVtYnMoKSB9PC9kaXY+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgJ1xuICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkluY2x1ZGUgd2lkZ2V0cyB3aXRob3V0IGFueSBsaW5rcyB0byByZWxldmFudCB0b3BpY3M/XCJcbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlSXJyZWxldmFudFdpZGdldHN9XG4gICAgICAgICAgICAgICAgICA+PGkgY2xhc3NOYW1lPXsnZmEgZmEtdG9nZ2xlLScgKyAoIHdpdGhJcnJlbGV2YW50V2lkZ2V0cyA/ICdvbicgOiAnb2ZmJyApIH1cbiAgICAgICAgICAgICAgICAgID48L2k+IDxzcGFuPklzb2xhdGVkIFdpZGdldHM8L3NwYW4+PC9idXR0b24+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsnXG4gICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiSW5jbHVkZSBhcmVhLW5lc3RpbmcgcmVsYXRpb25zaGlwcz9cIlxuICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVDb250YWluZXJzfVxuICAgICAgICAgICAgICAgICAgPjxpIGNsYXNzTmFtZT17J2ZhIGZhLXRvZ2dsZS0nICsgKCB3aXRoQ29udGFpbmVycyA/ICdvbicgOiAnb2ZmJyApIH1cbiAgICAgICAgICAgICAgICAgID48L2k+IDxzcGFuPkNvbnRhaW5lcnM8L3NwYW4+PC9idXR0b24+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsnXG4gICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiRmxhdHRlbiBjb21wb3NpdGlvbnMgaW50byB0aGVpciBydW50aW1lIGNvbnRlbnRzP1wiXG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUNvbXBvc2l0aW9uc31cbiAgICAgICAgICAgICAgICAgID48aSBjbGFzc05hbWU9eydmYSBmYS10b2dnbGUtJyArICggd2l0aEZsYXRDb21wb3NpdGlvbnMgPyAnb24nIDogJ29mZicgKSB9XG4gICAgICAgICAgICAgICAgICA+PC9pPiA8c3Bhbj5GbGF0dGVuIENvbXBvc2l0aW9uczwvc3Bhbj48L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPEdyYXBoIGNsYXNzTmFtZT0nbmJlLXRoZW1lLWZ1c2Vib3gtYXBwJ1xuICAgICAgICAgICAgICAgICAgIHR5cGVzPXtncmFwaFN0b3JlLnR5cGVzfVxuICAgICAgICAgICAgICAgICAgIG1vZGVsPXtncmFwaFN0b3JlLmdyYXBofVxuICAgICAgICAgICAgICAgICAgIGxheW91dD17bGF5b3V0U3RvcmUubGF5b3V0fVxuICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50cz17bGF5b3V0U3RvcmUubWVhc3VyZW1lbnRzfVxuICAgICAgICAgICAgICAgICAgIHNldHRpbmdzPXtzZXR0aW5nc1N0b3JlLnNldHRpbmdzfVxuICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbj17c2VsZWN0aW9uU3RvcmUuc2VsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcj17ZGlzcGF0Y2hlci5kaXNwYXRjaH0gLz5cbiAgICAgICAgIDwvZGl2PlxuICAgICAgKTtcblxuICAgICAgZnVuY3Rpb24gcmVuZGVyQnJlYWRDcnVtYnMoKSB7XG4gICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e1JPT1RfSUR9IHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgcGFnZS1pbnNwZWN0b3ItYnJlYWRjcnVtYidcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCBudWxsICl9PlxuICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9J2ZhIGZhLWhvbWUnPjwvaT5cbiAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICBdLmNvbmNhdCggY29tcG9zaXRpb25TdGFjay5tYXAoIGlkID0+XG4gICAgICAgICAgICBhY3RpdmVDb21wb3NpdGlvbiA9PT0gaWQgPyBpZCA6XG4gICAgICAgICAgICAgICA8YnV0dG9uIGtleT17aWR9IHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgcGFnZS1pbnNwZWN0b3ItYnJlYWRjcnVtYidcbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCBpZCApfT57IGlkIH08L2J1dHRvbj5cbiAgICAgICAgKSApO1xuICAgICAgfVxuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIHJldHVybiB7IG9uRG9tQXZhaWxhYmxlOiAoKSA9PiB7XG4gICAgICBkb21BdmFpbGFibGUgPSB0cnVlO1xuICAgICAgcmVuZGVyKCk7XG4gICB9IH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgIG5hbWU6ICdwYWdlLWluc3BlY3Rvci13aWRnZXQnLFxuICAgaW5qZWN0aW9uczogWyAnYXhDb250ZXh0JywgJ2F4RXZlbnRCdXMnLCAnYXhSZWFjdFJlbmRlcicgXSxcbiAgIGNyZWF0ZVxufTtcbiJdfQ==
