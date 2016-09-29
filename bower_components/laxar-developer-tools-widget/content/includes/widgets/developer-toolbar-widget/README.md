# AxDeveloperToolbarWidget

The AxDeveloperToolsWidget helps to visualize of the position of host application widgets and their grid alignment.


## Content
* [Features](#features)
* [Integration](#integration)
* [References](#references)


### Features

#### 1. Visualize Widgets within the Host Application

*R1.1* The widget MUST offer a button that creates an outline around the host application widgets.


#### 2. Visualize the CSS Grid of the Host Application _(grid)_.

*R2.1* The widget MUST offer a button that causes a grid visualization layer to be shown in the host application.

*R2.2* The widget MUST allow for the grid visualization layer to be configured through a resource.
The widget MUST act as a slave to the grid resource.


#### 3. Show Toolbar or a Message

*R3.1* The widget MUST listen to flags and either show a toolbar with the buttons for the features above or if no LaxarJS Application is available it MUST show a message.


## Integration

### Patterns

The widget supports the following event patterns as specified by the [LaxarJS Patterns] documentation.

#### Resources

* Resource: grid.resource
* Role: Receiver
* Description: The grid resource has the following fields, which have precedence over the corresponding fields in the widget configuration:
    - `selector` a CSS selector string that determines where to insert the grid layer
    - `columns` grid column configuration: `{ count: 12, width: 72, gutter: 26, padding: 13 }`
    - `css` additional CSS styles that should be applied to the grid layer


* Flag: detailsOn
* Role: Receiver
* Description: If a LaxarJS application is available the widget shows details about it


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"
