# host-connector-widget

Reads development information from the host application or from an inspected window and publishes it on the event bus for other developer tools widgets.
This widget is tightly coupled to the _laxar-developer-tools-widget_, whose captured information it bridges to the event bus within the developer tools widget.


## Content

* [Appearance](#appearance)
* [Usage](#usage)
* [Features](#features)
* [Integration](#integration)
* [References](#references)


## Appearance

The host-connector-widget has no visual representation.
It is a widget (and not an activity) because it heavily uses the browser object model to communicate with the host application.


## Usage

### Configuration example

```json
{
   "widget": "host-connector-widget",
   "features": {
      "development": {
         "liveReload": true
      },
      "events": {
         "stream": "myEventStream"
      },
      "log": {
         "stream": "myLogMessages"
      },
      "pageInfo": {
         "resource": "myPageInfo"
      },
      "grid": {
         "resource": "gridSettings"
      },
      "laxarApplication": {
         "flag": "isLaxarApplication"
      }
   }
}
```

Use this configuration on a page for an host-connector-widget that publishes `didProduce.myEventStream` and
`didProduce.myLogMessages` stream events, and publishes user-defined grid-settings from the host application using the `gridSettings` resource.

For full configuration options refer to the [widget.json](widget.json).


## Features

### 1. Read and Publish EventBus Activity from the Host Application _(events)_

*R1.1* The widget MUST poll the host application for event bus interactions and publish them through the configured stream topic.


### 2. Read and Publish Log Messages from the Host Application _(log)_

*R2.1* The widget MUST poll the host application for log messages and publish them through the configured stream topic.


### 3. Read and Publish CSS Grid Settings from the Host Application _(grid)_

*R3.1* The widget MUST query the host application for CSS grid settings and publish them through the configured resource.


### 4. Read and Publish Page Inspectiona data _(page)_

*R4.1* The widget MUST poll the host application for page inspection information and publish this information as a resource using didReplace.


### 5. Publish Flag about the State of the Application

*R5.1* The Widget MUST publish the state if a LaxarJS Application is available.


## Integration

### Patterns

Together with other developer-tools widgets, this widget uses the non-standard `didProduce.*` event stream protocol.
Additionally the widget supports the following event patterns as specified by the [LaxarJS Patterns] documentation.


#### Resources

* Resource: grid.resource
* Role: Sender
* Description: Publish CSS grid settings from the host application

* Resource: pageInfo.resource
* Role: Sender
* Description: Publish page and composition information from the host application

* Flag: laxarApplication.flag
* Role: Sender
* Description: Publish if a LaxarJS application is available


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"
