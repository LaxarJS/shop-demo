# page-inspector-widget

> Visualizes the widgets on the current page and their event connections

This widget is implemented using React/JSX:
When making changes, be sure to use the `grunt develop` task for live compilation.


## Usage

Best results with using this widget through the LaxarJS developer tools are achieved if the correct meta data has been added to the host application's widgets.


### Resources (purple)

If a widget *may publish* `didReplace` events for a configurable resource, it uses the role `outlet` for this resource *(resource-master)*:

```
"resource": {
   "type": "string",
   "format": "topic",
   "axRole": "outlet"
}
```

If a widget *may subscribe* to `didReplace` events for a configurable resource, it has the role `inlet` for this resource *(resource-slave)*:

```
"resource": {
   "type": "string",
   "format": "topic",
   "axRole": "inlet"
}
```


### Actions (orange)

If a widget *may publish* `takeActionRequest` events for a configurable action, it has the role `outlet` for this action *(action requester)*:

```
"action": {
   "type": "string",
   "format": "topic",
   "axRole": "outlet"
}
```

If a widget *may subscribe* to `takeActionRequest` event and *may publish* the corresponding `willTakeAction` and `didTakeAction` events for  a configurable action, it has the role `inlet` for this action *(action requestee)*.

```
"onActions": {
   "type": "array",
   "items": {
      "type": "string",
      "format": "topic",
      "axRole": "inlet"
   }
}
```


## Flags (green)

If a widget *may publish* `didChangeFlag` events for a configurable flag, it has the role `outlet` for it *(flag provider)*:

```
"flag": {
   "type": "string",
   "format": "topic",
   "axRole": "outlet"
}
```


If a widget *subscribes* to `didChangeFlag` events for a configurable flag, it has the role `inlet` for it *(flag consumer)*:

```
"assumeSomeStateOn": {
   "type": "string",
   "format": "flag-topic",
   "axRole": "inlet",
   "axPattern": "flag"
}
```

Note that `"axPattern"` has to be specified explicitly, because the name of the attribute is not *flag* in this example.
