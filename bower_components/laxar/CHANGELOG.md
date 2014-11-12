# Changelog

## Last Changes


## v0.17.0

- [#108](https://github.com/LaxarJS/laxar/issues/108): documentation: unify code-snippet format, and some polish
- [#109](https://github.com/LaxarJS/laxar/issues/109): documentation: added manual on providing controls
- [#107](https://github.com/LaxarJS/laxar/issues/107): angular widget adapter: added widget specific event bus service.
- [#106](https://github.com/LaxarJS/laxar/issues/106): documentation: fixed manuals, improved introduction in README.md
- [#93](https://github.com/LaxarJS/laxar/issues/93): refactoring: extracted page related services into own files.
- [#98](https://github.com/LaxarJS/laxar/issues/98): documentation: added manual on events and pub/sub
- [#100](https://github.com/LaxarJS/laxar/issues/100): widget loader: added angular widget as default integration.
- [#105](https://github.com/LaxarJS/laxar/issues/105): moved resumable timer handling from flow to timer.
- [#104](https://github.com/LaxarJS/laxar/issues/104): configuration: deprecated configuration keys are no handled at one place.
- [#101](https://github.com/LaxarJS/laxar/issues/101): documentation: use "«" rather than "<<" for backwards navigation links
- [#76](https://github.com/LaxarJS/laxar/issues/76): documentation: widgets and activities
- [#75](https://github.com/LaxarJS/laxar/issues/75): documentation: flow and places.
- [#96](https://github.com/LaxarJS/laxar/issues/96): documentation: restructured existing documents and added stubs for missing ones.
- [#95](https://github.com/LaxarJS/laxar/issues/95): documentation: wrote a motivational article for LaxarJS.
- [#94](https://github.com/LaxarJS/laxar/issues/94): footprint: removed the outdated app stub in favor of grunt-init (see README.md)
- [#38](https://github.com/LaxarJS/laxar/issues/38): documentation: pages and compositions.
- [#91](https://github.com/LaxarJS/laxar/issues/91): portal: make sure that widget DOM is attached when linking
- [#90](https://github.com/LaxarJS/laxar/issues/90): documentation: secondary parts of any LaxarJS application
    + NEW FEATURE: see ticket for details
- [#89](https://github.com/LaxarJS/laxar/issues/89): documentation: primary concepts of LaxarJS
- [#84](https://github.com/LaxarJS/laxar/issues/84): storage: storing `undefined` now causes the entry to be removed


## v0.16.0

- [#87](https://github.com/LaxarJS/laxar/issues/87): portal: Ensure anonymization of logged events.
- [#86](https://github.com/LaxarJS/laxar/issues/86): logging: Added tests to ensure that string format compatible format strings using indexed placeholders are supported.
- [#85](https://github.com/LaxarJS/laxar/issues/85): utilities: Implemented support for value mapping functions in string.format.
    + NEW FEATURE: see ticket for details
- [#83](https://github.com/LaxarJS/laxar/issues/83): portal: provided a timestamp service with a mock that works with jasmine
    + NEW FEATURE: see ticket for details
- [#81](https://github.com/LaxarJS/laxar/issues/81): added check for duplicate area definitions in layouts


## v0.15.0

- [#82](https://github.com/LaxarJS/laxar/issues/82): implemented directives axId and axFor
    + NEW FEATURE: see ticket for details
- [#80](https://github.com/LaxarJS/laxar/issues/80): storage: Improved detection of WebStorage API for Internet Explorer
- [#79](https://github.com/LaxarJS/laxar/issues/79): assert: details given as object are now serialized
- [#77](https://github.com/LaxarJS/laxar/issues/77): flow: the log tag `PLCE` with the current place name is set after navigation


## v0.14.0

- [#73](https://github.com/LaxarJS/laxar/issues/73): portal: fixed lookup of merged CSS file
- [#69](https://github.com/LaxarJS/laxar/issues/69): portal: moved setting widget root element IDs to widget loader
- [#68](https://github.com/LaxarJS/laxar/issues/68): fixed wrongly global assert in jshintrc.
- [#67](https://github.com/LaxarJS/laxar/issues/67): re-added missing widget root element IDs.
- [#65](https://github.com/LaxarJS/laxar/issues/65): fixed navigation being broken when parameter values were missing.
- [#66](https://github.com/LaxarJS/laxar/issues/66): prevented endless navigation ping pong in flow controller
- [#63](https://github.com/LaxarJS/laxar/issues/63): axVisibilityService: use scope.$id to identify handlers, not scope.id
- [#62](https://github.com/LaxarJS/laxar/issues/62): fixed endless recursion on navigation when place and target have the same name.


## v0.13.0

- [#61](https://github.com/LaxarJS/laxar/issues/61): added first profiling tools for scope property watchers.
    + NEW FEATURE: see ticket for details
- [#60](https://github.com/LaxarJS/laxar/issues/60): tests: make sure PhantomJS is installed properly, before running spec tests.
- [#52](https://github.com/LaxarJS/laxar/issues/52): portal, testing: added visibility events and the `axVisibilityService`
    + NEW FEATURE: see ticket for details
- [#59](https://github.com/LaxarJS/laxar/issues/59): portal: fixed dangling comma in timer imports
- [#58](https://github.com/LaxarJS/laxar/issues/58): portal, json: fixed copyright headers
- [#57](https://github.com/LaxarJS/laxar/issues/57): portal: fixed double-navigation problem which can lead to skipping places
- [#56](https://github.com/LaxarJS/laxar/issues/56): object: removed all direct calls of hasOwnProperty.
- [#55](https://github.com/LaxarJS/laxar/issues/55): run_spec: disable loading the `widget.json` if the `spec_runner.js` contains `widgetJson: false`
- [#54](https://github.com/LaxarJS/laxar/issues/54): testing: fixed broken testBed injection of $q and $timeout
- [#50](https://github.com/LaxarJS/laxar/issues/50): performance: decoupled instantiation of widget controllers from their DOM


## v0.12.0

- [#49](https://github.com/LaxarJS/laxar/issues/49): added compatibility layer for JSON patch.
    + NEW FEATURE: see ticket for details
- [#48](https://github.com/LaxarJS/laxar/issues/48): Promises generated by the event bus are now scheduled by the event bus, not by AngularJS `$apply`.
- [#51](https://github.com/LaxarJS/laxar/issues/51): Remove some obsolete NPM `devDependencies`.
- [#47](https://github.com/LaxarJS/laxar/issues/47): Do not schedule another full event-bus tick while one is already being processed.
- [#46](https://github.com/LaxarJS/laxar/issues/46): fixed misinterpretation of falsy required attribute in json schema converter.
- [#45](https://github.com/LaxarJS/laxar/issues/45): i18n: adjusted localizer.format specs to changes from [#43](https://github.com/LaxarJS/laxar/issues/43).
- [#43](https://github.com/LaxarJS/laxar/issues/43): string: added new function `string.format` as simpler replacement for `text` library.
    + NEW FEATURE: see ticket for details
- [#42](https://github.com/LaxarJS/laxar/issues/42): portal: added 'language-tag', 'topic-map' and 'localization' formats.
    + NEW FEATURE: see ticket for details
- [#40](https://github.com/LaxarJS/laxar/issues/40): portal: fixed 'flag-topic' pattern.


## v0.11.0

- [#39](https://github.com/LaxarJS/laxar/issues/39): portal: added JSON-schema formats 'topic', 'sub-topic' and 'flag-topic' to widget loader.
    + NEW FEATURE: see ticket for details
- [#37](https://github.com/LaxarJS/laxar/issues/37): improved browsing of existing api doc and fixed some syntactical errors.
- [#36](https://github.com/LaxarJS/laxar/issues/36): jshintrc: disabled enforcement of dot notation for object property access.
- [#34](https://github.com/LaxarJS/laxar/issues/34): Enabled specification of widget features using JSON schema draft v4 notation.
    + NEW FEATURE: see ticket for details
- [#33](https://github.com/LaxarJS/laxar/issues/33): EventBus: added event object to the information sent to inspectors on deliver actions.
- [#31](https://github.com/LaxarJS/laxar/issues/31): Refactored JSON validator for better error messages and schema v4 support.
    + NEW FEATURE: see ticket for details
- [#32](https://github.com/LaxarJS/laxar/issues/32): Configuration: Consolidated and documented configuration options under docs/manuals/configuration.md
    + NEW FEATURE: see ticket for details
- [#30](https://github.com/LaxarJS/laxar/issues/30): PageLoader: added missing check for duplicate composition ids.


## v0.10.0

- [#27](https://github.com/LaxarJS/laxar/issues/27): Portal: Enhanced the portal event bus performance by not requiring a digest/render-cycle on each tick
- [#28](https://github.com/LaxarJS/laxar/issues/28): Fixed null values in widget features within compositions being turned into empty objects.
- [#29](https://github.com/LaxarJS/laxar/issues/29): PageLoader: composition features that are not configured do not result in undefined values for widget features.
- [#25](https://github.com/LaxarJS/laxar/issues/25): Only the page relevant for the current place is loaded now.
- [#17](https://github.com/LaxarJS/laxar/issues/17): Testing: The testBed.setup method can now simulate default-events
    + NEW FEATURE: see ticket for details
- [#26](https://github.com/LaxarJS/laxar/issues/26): Testing: Fixed the responseTransform option for http-mock
- [#22](https://github.com/LaxarJS/laxar/issues/22): FileResourceProvider: allow to embed files into listings
    + NEW FEATURE: see ticket for details
- [#15](https://github.com/LaxarJS/laxar/issues/15): FileResourceProvider, PageLoader: Prevented duplicate (simultaneous) requests to file listings
- [#24](https://github.com/LaxarJS/laxar/issues/24): Widgets and compositions can now be disabled in pages.
    + NEW FEATURE: see ticket for details
- [#23](https://github.com/LaxarJS/laxar/issues/23): FileResourceProvider: Slashes are now correctly handled when checking a file for existence in a listing.
- [#21](https://github.com/LaxarJS/laxar/issues/21): The file resource provider now normalizes its root path.
- [#20](https://github.com/LaxarJS/laxar/issues/20): Fixed event bus inspectors not being notified on unsubscription.
- [#14](https://github.com/LaxarJS/laxar/issues/14): Fixed navigation being broken after successive navigation to the current location.
- [#13](https://github.com/LaxarJS/laxar/issues/13): The current place is now send as part of the didNavigate event.
- [#12](https://github.com/LaxarJS/laxar/issues/12): Testing: Get the LaxarJS tests running in Karma again.
- [#11](https://github.com/LaxarJS/laxar/issues/11): Testing: Handle `spec_runner.js` that are not in a subdirectory of the RequireJS' `baseUrl`.
- [#10](https://github.com/LaxarJS/laxar/issues/10): Testing: Loading controls during tests now works in Karma.
- [#9](https://github.com/LaxarJS/laxar/issues/9): Update Bower from ~1.2.8 to ~1.3.3.
- [#8](https://github.com/LaxarJS/laxar/issues/8): Fixed the cleanup mechanism for generated widget areas.
- [#6](https://github.com/LaxarJS/laxar/issues/6): The Portal now initializes an i18n object on the application's `$rootScope`
- [#5](https://github.com/LaxarJS/laxar/issues/5): Testing: The run_spec-script (used to set up the spec tests) now loads controls declared in the widget.json
- [#4](https://github.com/LaxarJS/laxar/issues/4): PageLoader: Added missing optional negation of generated topics and replacement of expressions in feature keys
- [#3](https://github.com/LaxarJS/laxar/issues/3): Added url formatting for links in Readme.md
- [#2](https://github.com/LaxarJS/laxar/issues/2): Fixed grunt-init step in Getting-Started docs
- [#1](https://github.com/LaxarJS/laxar/issues/1): Added initial Getting-Started documentation
