# log-display-widget

Shows a list of log messages received through a stream of wrapper events.


## Content
* [Appearance](#appearance)
* [Usage](#usage)
* [Features](#features)
* [Integration](#integration)
* [References](#references)


## Appearance

The events display widget has comprehensive styling even when using the default theme.
Because it is only used for development, most of the time no theming is needed.


## Usage

For widget prerequisites consult the [bower.json](bower.json).

### Configuration example

```json
{
   "widget": "log-display-widget",
   "features": {
      "log": {
         "stream": "myLogMessages"
      }
   }
}
```
The log-display-widget, configured read events from `didProduce.myLogMessages` wrapper events.

For full configuration options refer to the [widget.json](widget.json).


## Features

### 1. Display Log Messages _(log)_

*R1.1* The widget MUST subscribe to the configured message stream _(log.stream)_ to obtain log message items for display.

*R1.2* Each message item MUST be represented as a _table_ row.
An item models a single LaxarJS log message.

*R1.3* The widget MUST keep and display a limited number of log messages only _(the buffer)_.
The buffer size MUST be configurable.
When the maximum buffer size is exceeded, log messages received first MUST be discarded first.

*R1.4* The widget MUST allow the user to _clear_ the buffer manually, removing all log message rows from view.


## Integration

### Patterns

The widget does not support any standard event patterns.
Together with other developer-tools widgets it uses the non-standard `didProduce.*` event stream protocol.


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts](https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md)
* [LaxarJS Manuals: Events and Publish-Subscribe](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md)
