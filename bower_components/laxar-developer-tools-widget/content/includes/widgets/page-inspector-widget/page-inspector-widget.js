/* jshint ignore:start */
define(['exports', 'module', 'react', 'laxar-patterns', 'wireflow', './graph-helpers'], function (exports, module, _react, _laxarPatterns, _wireflow, _graphHelpers) {'use strict';function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}var _React = _interopRequireDefault(_react);var _patterns = _interopRequireDefault(_laxarPatterns);var _wireflow2 = _interopRequireDefault(_wireflow);var 







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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhZ2UtaW5zcGVjdG9yLXdpZGdldC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFRZSxpQkFBYyx5QkFBM0IsU0FBUyxDQUFJLGNBQWM7QUFDaEIsZUFBWSx5QkFBdkIsT0FBTyxDQUFJLFlBQVk7QUFDYixjQUFXLHlCQUFyQixNQUFNLENBQUksV0FBVztBQUNyQixRQUFLLEtBQUksVUFBVSxtQkFBVixVQUFVLEtBQWEsY0FBYyxtQkFBekIsT0FBTyxDQUFJLGNBQWM7QUFDOUMsV0FBUTtBQUNOLFVBQU8sS0FBSSxVQUFVLDhCQUFWLFVBQVUsS0FBRSxjQUFjLDhCQUFkLGNBQWM7QUFDckMsUUFBSyxLQUFJLFFBQVEsNEJBQVIsUUFBUSxLQUFFLFNBQVMsNEJBQVQsU0FBUyxLQUFFLFVBQVUsNEJBQVYsVUFBVTtBQUN4QyxnQkFBYSxzQkFBYixhQUFhOztBQUVmLGFBQVUseUJBQVYsVUFBVTtBQUNJLFFBQUsseUJBQW5CLFVBQVUsQ0FBSSxLQUFLOzs7O0FBSXJCLFlBQVMsTUFBTSxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFHOztBQUUvQyxVQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDcEIsVUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLFVBQUksU0FBUyxHQUFHLElBQUksQ0FBQztBQUNyQixVQUFJLG9CQUFvQixHQUFHLElBQUksQ0FBQzs7QUFFaEMsVUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7QUFDbEMsVUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzFCLFVBQUksb0JBQW9CLEdBQUcsS0FBSyxDQUFDOztBQUVqQyxVQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztBQUMxQixVQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQzs7QUFFN0IsVUFBSSxrQkFBa0IsR0FBRyxJQUFJLENBQUM7O0FBRTlCLDJCQUFTLFNBQVMsQ0FBQyxVQUFVLENBQUUsT0FBTyxDQUFFO0FBQ3BDLGlDQUEyQixDQUFF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QUFDdEQsbURBQUcsU0FBUyxFQUFDLFlBQVksR0FBSyxDQUN4QixDQUNWOztBQUFDLGtCQUFNLENBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFFLFVBQUEsRUFBRTtBQUMvQixtQ0FBaUIsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUMxQiw4REFBUSxHQUFHLEVBQUUsRUFBRSxBQUFDLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsd0NBQXdDO0FBQ3pFLDRCQUFPLEVBQUUsb0JBQU0sd0JBQXdCLENBQUUsRUFBRSxDQUFFLEVBQUEsQUFBQyxJQUFHLEVBQUUsQ0FBVyxHQUFBLENBQzVFLENBQUUsQ0FBQyxDQUNMLENBQ0g7Ozs7Ozs7QUFJRCxhQUFPLEVBQUUsY0FBYyxFQUFFLDBCQUFNO0FBQzVCLHdCQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLGtCQUFNLEVBQUUsQ0FBQyxDQUNYLEVBQUUsQ0FBQyxDQUNOOzs7O0FBRWM7QUFDWixVQUFJLEVBQUUsdUJBQXVCO0FBQzdCLGdCQUFVLEVBQUUsQ0FBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBRTtBQUMxRCxZQUFNLEVBQU4sTUFBTSxFQUNSIiwiZmlsZSI6InBhZ2UtaW5zcGVjdG9yLXdpZGdldC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgcGF0dGVybnMgZnJvbSAnbGF4YXItcGF0dGVybnMnO1xuXG5pbXBvcnQgd2lyZWZsb3cgZnJvbSAnd2lyZWZsb3cnO1xuXG5pbXBvcnQgeyB0eXBlcywgZ3JhcGgsIGxheW91dCwgZmlsdGVyRnJvbVNlbGVjdGlvbiwgUk9PVF9JRCB9IGZyb20gJy4vZ3JhcGgtaGVscGVycyc7XG5cbmNvbnN0IHtcbiAgc2VsZWN0aW9uOiB7IFNlbGVjdGlvblN0b3JlIH0sXG4gIGhpc3Rvcnk6IHsgSGlzdG9yeVN0b3JlIH0sXG4gIGxheW91dDogeyBMYXlvdXRTdG9yZSB9LFxuICBncmFwaDogeyBHcmFwaFN0b3JlLCBhY3Rpb25zOiB7IEFjdGl2YXRlVmVydGV4IH0gfSxcbiAgc2V0dGluZ3M6IHtcbiAgICBhY3Rpb25zOiB7IENoYW5nZU1vZGUsIE1pbmltYXBSZXNpemVkIH0sXG4gICAgbW9kZWw6IHsgU2V0dGluZ3MsIFJFQURfT05MWSwgUkVBRF9XUklURSB9LFxuICAgIFNldHRpbmdzU3RvcmVcbiAgfSxcbiAgRGlzcGF0Y2hlcixcbiAgY29tcG9uZW50czogeyBHcmFwaCB9XG59ID0gd2lyZWZsb3c7XG5cblxuZnVuY3Rpb24gY3JlYXRlKCBjb250ZXh0LCBldmVudEJ1cywgcmVhY3RSZW5kZXIgKSB7XG5cbiAgIGxldCB2aXNpYmxlID0gZmFsc2U7XG4gICBsZXQgZG9tQXZhaWxhYmxlID0gZmFsc2U7XG4gICBsZXQgdmlld01vZGVsID0gbnVsbDtcbiAgIGxldCB2aWV3TW9kZWxDYWxjdWxhdGlvbiA9IG51bGw7XG5cbiAgIGxldCB3aXRoSXJyZWxldmFudFdpZGdldHMgPSBmYWxzZTtcbiAgIGxldCB3aXRoQ29udGFpbmVycyA9IHRydWU7XG4gICBsZXQgd2l0aEZsYXRDb21wb3NpdGlvbnMgPSBmYWxzZTtcblxuICAgbGV0IGNvbXBvc2l0aW9uU3RhY2sgPSBbXTtcbiAgIGxldCBhY3RpdmVDb21wb3NpdGlvbiA9IG51bGw7XG5cbiAgIGxldCBwdWJsaXNoZWRTZWxlY3Rpb24gPSBudWxsO1xuXG4gICBwYXR0ZXJucy5yZXNvdXJjZXMuaGFuZGxlckZvciggY29udGV4dCApXG4gICAgICAucmVnaXN0ZXJSZXNvdXJjZUZyb21GZWF0dXJlKCAncGFnZUluZm8nLCB7XG4gICAgICAgICBvblVwZGF0ZVJlcGxhY2U6ICgpID0+IGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKVxuICAgICAgfSApO1xuXG5cbiAgIGNvbnN0IHB1Ymxpc2hGaWx0ZXIgPSBwYXR0ZXJucy5yZXNvdXJjZXMucmVwbGFjZVB1Ymxpc2hlckZvckZlYXR1cmUoIGNvbnRleHQsICdmaWx0ZXInLCB7XG4gICAgICBpc09wdGlvbmFsOiB0cnVlXG4gICB9ICk7XG5cbiAgIGV2ZW50QnVzLnN1YnNjcmliZSggYGRpZENoYW5nZUFyZWFWaXNpYmlsaXR5LiR7Y29udGV4dC53aWRnZXQuYXJlYX1gLCAoZXZlbnQsIG1ldGEpID0+IHtcbiAgICAgIGlmKCAhdmlzaWJsZSAmJiBldmVudC52aXNpYmxlICkge1xuICAgICAgICAgdmlzaWJsZSA9IHRydWU7XG4gICAgICAgICByZW5kZXIoKTtcbiAgICAgIH1cbiAgIH0gKTtcblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiByZXBsYWNlRmlsdGVyKCBzZWxlY3Rpb24sIGdyYXBoTW9kZWwgKSB7XG4gICAgICBjb25zdCByZXNvdXJjZSA9IGNvbnRleHQuZmVhdHVyZXMuZmlsdGVyLnJlc291cmNlO1xuICAgICAgaWYoICFyZXNvdXJjZSB8fCBzZWxlY3Rpb24gPT09IHB1Ymxpc2hlZFNlbGVjdGlvbiApIHtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHB1Ymxpc2hlZFNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgIHB1Ymxpc2hGaWx0ZXIoIGZpbHRlckZyb21TZWxlY3Rpb24oIHNlbGVjdGlvbiwgZ3JhcGhNb2RlbCApICk7XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgZnVuY3Rpb24gdG9nZ2xlSXJyZWxldmFudFdpZGdldHMoKSB7XG4gICAgICB3aXRoSXJyZWxldmFudFdpZGdldHMgPSAhd2l0aElycmVsZXZhbnRXaWRnZXRzO1xuICAgICAgaW5pdGlhbGl6ZVZpZXdNb2RlbCggdHJ1ZSApO1xuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIHRvZ2dsZUNvbnRhaW5lcnMoKSB7XG4gICAgICB3aXRoQ29udGFpbmVycyA9ICF3aXRoQ29udGFpbmVycztcbiAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKTtcbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiB0b2dnbGVDb21wb3NpdGlvbnMoKSB7XG4gICAgICB3aXRoRmxhdENvbXBvc2l0aW9ucyA9ICF3aXRoRmxhdENvbXBvc2l0aW9ucztcbiAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoIHRydWUgKTtcbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiBlbnRlckNvbXBvc2l0aW9uSW5zdGFuY2UoIGlkICkge1xuICAgICAgaWYoIGlkID09PSBST09UX0lEICkge1xuICAgICAgICAgaWQgPSBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCA+IDEgPyBjb21wb3NpdGlvblN0YWNrWyBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCAtIDIgXSA6IG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBnb1RvVG9wID0gaWQgPT09IG51bGw7XG4gICAgICBjb25zdCB0YXJnZXRJbmRleCA9IGdvVG9Ub3AgPyAwIDogY29tcG9zaXRpb25TdGFjay5pbmRleE9mKCBpZCApO1xuICAgICAgaWYoIHRhcmdldEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgIGNvbXBvc2l0aW9uU3RhY2sucHVzaCggaWQgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgY29tcG9zaXRpb25TdGFjay5zcGxpY2UoIGdvVG9Ub3AgPyAwIDogdGFyZ2V0SW5kZXggKyAxLCBjb21wb3NpdGlvblN0YWNrLmxlbmd0aCAtIHRhcmdldEluZGV4ICk7XG4gICAgICB9XG4gICAgICBhY3RpdmVDb21wb3NpdGlvbiA9IGlkO1xuICAgICAgaW5pdGlhbGl6ZVZpZXdNb2RlbCggdHJ1ZSApO1xuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIGluaXRpYWxpemVWaWV3TW9kZWwoIGRvUmVzZXQgKSB7XG4gICAgICBpZiggZG9SZXNldCApIHtcbiAgICAgICAgIHZpZXdNb2RlbCA9IG51bGw7XG4gICAgICAgICBjbGVhclRpbWVvdXQoIHZpZXdNb2RlbENhbGN1bGF0aW9uICk7XG4gICAgICAgICB2aWV3TW9kZWxDYWxjdWxhdGlvbiA9IG51bGw7XG4gICAgICAgICBpZiggdmlzaWJsZSApIHtcbiAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiggdmlzaWJsZSApIHtcbiAgICAgICAgIC8vIHNldFRpbWVvdXQ6IHVzZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGJyb3dzZXIgc2hvd3MgdGhlIHNwaW5uZXIgYmVmb3JlIHN0YWxsaW5nIGZvciBsYXlvdXRcbiAgICAgICAgIHZpZXdNb2RlbENhbGN1bGF0aW9uID0gdmlld01vZGVsQ2FsY3VsYXRpb24gfHwgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFnZVR5cGVzID0gdHlwZXMoKTtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VJbmZvID0gY29udGV4dC5yZXNvdXJjZXMucGFnZUluZm87XG4gICAgICAgICAgICBjb25zdCBwYWdlR3JhcGggPSBncmFwaCggcGFnZUluZm8sIHtcbiAgICAgICAgICAgICAgIHdpdGhJcnJlbGV2YW50V2lkZ2V0cyxcbiAgICAgICAgICAgICAgIHdpdGhDb250YWluZXJzLFxuICAgICAgICAgICAgICAgY29tcG9zaXRpb25EaXNwbGF5OiB3aXRoRmxhdENvbXBvc2l0aW9ucyA/ICdGTEFUJyA6ICdDT01QQUNUJyxcbiAgICAgICAgICAgICAgIGFjdGl2ZUNvbXBvc2l0aW9uXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICAgICBjb25zdCBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoIHJlbmRlciApO1xuICAgICAgICAgICAgbmV3IEhpc3RvcnlTdG9yZSggZGlzcGF0Y2hlciApO1xuICAgICAgICAgICAgY29uc3QgZ3JhcGhTdG9yZSA9IG5ldyBHcmFwaFN0b3JlKCBkaXNwYXRjaGVyLCBwYWdlR3JhcGgsIHBhZ2VUeXBlcyApO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0U3RvcmUgPSBuZXcgTGF5b3V0U3RvcmUoIGRpc3BhdGNoZXIsIGdyYXBoU3RvcmUgKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBuZXcgU2V0dGluZ3NTdG9yZSggZGlzcGF0Y2hlciwgU2V0dGluZ3MoeyBtb2RlOiBSRUFEX09OTFkgfSkgKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvblN0b3JlID0gbmV3IFNlbGVjdGlvblN0b3JlKCBkaXNwYXRjaGVyLCBsYXlvdXRTdG9yZSwgZ3JhcGhTdG9yZSApO1xuXG4gICAgICAgICAgICBkaXNwYXRjaGVyLnJlZ2lzdGVyKCBBY3RpdmF0ZVZlcnRleCwgKHsgdmVydGV4IH0pID0+IHtcbiAgICAgICAgICAgICAgIGlmKCB2ZXJ0ZXgua2luZCA9PT0gJ0NPTVBPU0lUSU9OJyB8fCB2ZXJ0ZXgua2luZCA9PT0gJ1BBR0UnICkge1xuICAgICAgICAgICAgICAgICAgZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCB2ZXJ0ZXguaWQgKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgdmlld01vZGVsID0geyBncmFwaFN0b3JlLCBsYXlvdXRTdG9yZSwgc2V0dGluZ3NTdG9yZSwgc2VsZWN0aW9uU3RvcmUsIGRpc3BhdGNoZXIgfTtcbiAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgfSwgMjAgKTtcbiAgICAgIH1cbiAgIH1cblxuICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICBpZiggIXZpc2libGUgfHwgIWRvbUF2YWlsYWJsZSApIHtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoICF2aWV3TW9kZWwgKSB7XG4gICAgICAgICByZWFjdFJlbmRlcihcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYWdlLWluc3BlY3Rvci1wbGFjZWhvbGRlcic+XG4gICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT0nZmEgZmEtY29nIGZhLXNwaW4nPjwvaT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgKTtcbiAgICAgICAgIGluaXRpYWxpemVWaWV3TW9kZWwoKTtcbiAgICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICAgZ3JhcGhTdG9yZSxcbiAgICAgICAgIGxheW91dFN0b3JlLFxuICAgICAgICAgc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgIHNlbGVjdGlvblN0b3JlLFxuICAgICAgICAgZGlzcGF0Y2hlclxuICAgICAgfSA9IHZpZXdNb2RlbDtcblxuICAgICAgcmVwbGFjZUZpbHRlciggc2VsZWN0aW9uU3RvcmUuc2VsZWN0aW9uLCBncmFwaFN0b3JlLmdyYXBoICk7XG5cblxuICAgICAgcmVhY3RSZW5kZXIoXG4gICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFnZS1pbnNwZWN0b3Itcm93IGZvcm0taW5saW5lJz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSd0ZXh0LXJpZ2h0Jz5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwdWxsLWxlZnQnPnsgcmVuZGVyQnJlYWRDcnVtYnMoKSB9PC9kaXY+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgJ1xuICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkluY2x1ZGUgd2lkZ2V0cyB3aXRob3V0IGFueSBsaW5rcyB0byByZWxldmFudCB0b3BpY3M/XCJcbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlSXJyZWxldmFudFdpZGdldHN9XG4gICAgICAgICAgICAgICAgICA+PGkgY2xhc3NOYW1lPXsnZmEgZmEtdG9nZ2xlLScgKyAoIHdpdGhJcnJlbGV2YW50V2lkZ2V0cyA/ICdvbicgOiAnb2ZmJyApIH1cbiAgICAgICAgICAgICAgICAgID48L2k+IDxzcGFuPklzb2xhdGVkIFdpZGdldHM8L3NwYW4+PC9idXR0b24+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsnXG4gICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiSW5jbHVkZSBhcmVhLW5lc3RpbmcgcmVsYXRpb25zaGlwcz9cIlxuICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVDb250YWluZXJzfVxuICAgICAgICAgICAgICAgICAgPjxpIGNsYXNzTmFtZT17J2ZhIGZhLXRvZ2dsZS0nICsgKCB3aXRoQ29udGFpbmVycyA/ICdvbicgOiAnb2ZmJyApIH1cbiAgICAgICAgICAgICAgICAgID48L2k+IDxzcGFuPkNvbnRhaW5lcnM8L3NwYW4+PC9idXR0b24+XG4gICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsnXG4gICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiRmxhdHRlbiBjb21wb3NpdGlvbnMgaW50byB0aGVpciBydW50aW1lIGNvbnRlbnRzP1wiXG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUNvbXBvc2l0aW9uc31cbiAgICAgICAgICAgICAgICAgID48aSBjbGFzc05hbWU9eydmYSBmYS10b2dnbGUtJyArICggd2l0aEZsYXRDb21wb3NpdGlvbnMgPyAnb24nIDogJ29mZicgKSB9XG4gICAgICAgICAgICAgICAgICA+PC9pPiA8c3Bhbj5GbGF0dGVuIENvbXBvc2l0aW9uczwvc3Bhbj48L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPEdyYXBoIGNsYXNzTmFtZT0nbmJlLXRoZW1lLWZ1c2Vib3gtYXBwJ1xuICAgICAgICAgICAgICAgICAgIHR5cGVzPXtncmFwaFN0b3JlLnR5cGVzfVxuICAgICAgICAgICAgICAgICAgIG1vZGVsPXtncmFwaFN0b3JlLmdyYXBofVxuICAgICAgICAgICAgICAgICAgIGxheW91dD17bGF5b3V0U3RvcmUubGF5b3V0fVxuICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50cz17bGF5b3V0U3RvcmUubWVhc3VyZW1lbnRzfVxuICAgICAgICAgICAgICAgICAgIHNldHRpbmdzPXtzZXR0aW5nc1N0b3JlLnNldHRpbmdzfVxuICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbj17c2VsZWN0aW9uU3RvcmUuc2VsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcj17ZGlzcGF0Y2hlci5kaXNwYXRjaH0gLz5cbiAgICAgICAgIDwvZGl2PlxuICAgICAgKTtcblxuICAgICAgZnVuY3Rpb24gcmVuZGVyQnJlYWRDcnVtYnMoKSB7XG4gICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e1JPT1RfSUR9IHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgcGFnZS1pbnNwZWN0b3ItYnJlYWRjcnVtYidcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCBudWxsICl9PlxuICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9J2ZhIGZhLWhvbWUnPjwvaT5cbiAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICBdLmNvbmNhdCggY29tcG9zaXRpb25TdGFjay5tYXAoIGlkID0+XG4gICAgICAgICAgICBhY3RpdmVDb21wb3NpdGlvbiA9PT0gaWQgPyBpZCA6XG4gICAgICAgICAgICAgICA8YnV0dG9uIGtleT17aWR9IHR5cGU9J2J1dHRvbicgY2xhc3NOYW1lPSdidG4gYnRuLWxpbmsgcGFnZS1pbnNwZWN0b3ItYnJlYWRjcnVtYidcbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZW50ZXJDb21wb3NpdGlvbkluc3RhbmNlKCBpZCApfT57IGlkIH08L2J1dHRvbj5cbiAgICAgICAgKSApO1xuICAgICAgfVxuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIHJldHVybiB7IG9uRG9tQXZhaWxhYmxlOiAoKSA9PiB7XG4gICAgICBkb21BdmFpbGFibGUgPSB0cnVlO1xuICAgICAgcmVuZGVyKCk7XG4gICB9IH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgIG5hbWU6ICdwYWdlLWluc3BlY3Rvci13aWRnZXQnLFxuICAgaW5qZWN0aW9uczogWyAnYXhDb250ZXh0JywgJ2F4RXZlbnRCdXMnLCAnYXhSZWFjdFJlbmRlcicgXSxcbiAgIGNyZWF0ZVxufTtcbiJdfQ==
