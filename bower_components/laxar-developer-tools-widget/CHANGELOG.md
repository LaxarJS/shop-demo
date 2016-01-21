# Changelog


## Last Changes


## v2.0.3

- [#49](https://github.com/LaxarJS/ax-developer-tools-widget/issues/49): fixed late listener registration


## v2.0.2

- [#47](https://github.com/LaxarJS/ax-developer-tools-widget/issues/47): fixed error messages after page navigation


## v2.0.1

- [#48](https://github.com/LaxarJS/ax-developer-tools-widget/issues/48): fixed initialization sequence of log channel and `developerHooks`


## v2.0.0

- [#45](https://github.com/LaxarJS/ax-developer-tools-widget/issues/45): polish (styles, documentation)
- [#38](https://github.com/LaxarJS/ax-developer-tools-widget/issues/38): documentation: added docs on page inspection
- [#44](https://github.com/LaxarJS/ax-developer-tools-widget/issues/44): project: now using laxar-mocks for testing, updated copyright
- [#42](https://github.com/LaxarJS/ax-developer-tools-widget/issues/42): tracker: moved event validation into developer tools window
    + **BREAKING CHANGE:** see ticket for details


## v2.0.0-alpha.3

- [#39](https://github.com/LaxarJS/ax-developer-tools-widget/issues/39): page inspection: added composition support
- [#43](https://github.com/LaxarJS/ax-developer-tools-widget/issues/43): page inspection: updated wireflow version


## v2.0.0-alpha.2

- [#40](https://github.com/LaxarJS/ax-developer-tools-widget/issues/40): page inspection: fixed filtering of isolated widgets when containers are hidden
- [#41](https://github.com/LaxarJS/ax-developer-tools-widget/issues/41): page inspection: improved display in safari


## v2.0.0-alpha.1

- [#37](https://github.com/LaxarJS/ax-developer-tools-widget/issues/37): page inspection: respect `enabled: false` when identifying topics


## v2.0.0-alpha.0

- [#36](https://github.com/LaxarJS/ax-developer-tools-widget/issues/36): fixed spec tests
- [#31](https://github.com/LaxarJS/ax-developer-tools-widget/issues/31): added prototype page inspector
- [#35](https://github.com/LaxarJS/ax-developer-tools-widget/issues/35): host-connector: fixed log message overflow
- [#34](https://github.com/LaxarJS/ax-developer-tools-widget/issues/34): fixed event timestamp in msie11
- [#32](https://github.com/LaxarJS/ax-developer-tools-widget/issues/32): host-connector: fixed host-window access problem in MSIE11


## v1.6.0

- [#29](https://github.com/LaxarJS/ax-developer-tools-widget/issues/29): added require_config.js
- [#28](https://github.com/LaxarJS/ax-developer-tools-widget/issues/28): tracker: clear state on $destroy
- [#27](https://github.com/LaxarJS/ax-developer-tools-widget/issues/27): tracker: allow will/didTakeAction without request
- [#26](https://github.com/LaxarJS/ax-developer-tools-widget/issues/26): tracker: fix handling of didUpdate before didReplace
- [#25](https://github.com/LaxarJS/ax-developer-tools-widget/issues/25): tracker: allow multiple simultaneous will/did replies


## v1.5.0

- [#24](https://github.com/LaxarJS/ax-developer-tools-widget/issues/24): new tracker feature: monitor pattern topics and detect problems
- [#23](https://github.com/LaxarJS/ax-developer-tools-widget/issues/23): fixed `ngSanitize` use in events display widget


## v1.4.0

- [#21](https://github.com/LaxarJS/ax-developer-tools-widget/issues/21): use regexp-search not only for name, but also source and target
- [#22](https://github.com/LaxarJS/ax-developer-tools-widget/issues/22): fixed spec tests
- [#20](https://github.com/LaxarJS/ax-developer-tools-widget/issues/20): capture events as soon as the axGlobalEventBus injection is available


## v1.3.0

- [#17](https://github.com/LaxarJS/ax-developer-tools-widget/issues/17): Support AMD references (and installation through bower)
- [#18](https://github.com/LaxarJS/ax-developer-tools-widget/issues/18): Added a `.travis.yml` for open continuous integration


## v1.2.0

- [#10](https://github.com/LaxarJS/ax-developer-tools-widget/issues/10): allow to disable the widget from application configuration
    + NEW FEATURE: see ticket for details
- [#15](https://github.com/LaxarJS/ax-developer-tools-widget/issues/15): fixed jshint validation and dependencies


## v1.1.0

- [#14](https://github.com/LaxarJS/ax-developer-tools-widget/issues/14): Updated internal app and LaxarJS dependencies to v1.0.0


## v1.0.0

- [#13](https://github.com/LaxarJS/ax-developer-tools-widget/issues/13): Updated to LaxarJS 1.0.0 style controls
    + **BREAKING CHANGE:** see ticket for details
- [#12](https://github.com/LaxarJS/ax-developer-tools-widget/issues/12): fixed log level.
- [#11](https://github.com/LaxarJS/ax-developer-tools-widget/issues/11): bower: added missing repository URL


## v0.2.0

- [#6](https://github.com/LaxarJS/ax-developer-tools-widget/issues/6): jshint: avoid validation problems with embedded application (also requires grunt-laxar#33 to fully work)
- [#8](https://github.com/LaxarJS/ax-developer-tools-widget/issues/8): template: show a button by default, to avoid problems with popup blockers
- [#9](https://github.com/LaxarJS/ax-developer-tools-widget/issues/9): tests: fixed broken spec tests
- [#7](https://github.com/LaxarJS/ax-developer-tools-widget/issues/7): browser support: widget should not break page in msie8
- [#5](https://github.com/LaxarJS/ax-developer-tools-widget/issues/5): documentation: fixed README.md links


## v0.1.0

- [#2](https://github.com/LaxarJS/ax-developer-tools-widget/issues/2): AxLogDisplayWidget: Fixed _clear_ button
- [#1](https://github.com/LaxarJS/ax-developer-tools-widget/issues/1): README: added missing example image
- [#4](https://github.com/LaxarJS/ax-developer-tools-widget/issues/4): fixed README.md code block
- [#3](https://github.com/LaxarJS/ax-developer-tools-widget/issues/3): added missing license

Initial OSS version.
