![alt text](https://www.marcobiagini.altervista.org/Projects/LampredottoJS/resources/darkcover%20Lamp.png "Lampredotto Cover")

# LAMPREDOTTO JS

Lampredotto JS is a set of specialised Javascript modules useful in the realisation of a Fron End project.

### RENDER MODULE

The RenderModule is designed for dynamic page rendering by defining a virtual DOM synchronised to the real DOM with a two-way proxy communication system. The framework is designed to work through customised components, making the development of the interface and its interactions granular and simplified.

#### How to use
```javascript
import RenderModule from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";

const controller = RenderEngine.instance.start("app");
await controller.build({
  dataset: {}, //data set used in the interface and within the application
  computed: {}, //dynamically defined read-only datasets while using the application
  actions: {}, //set of application functions
  events: [], //trigger of framework events
  settings: {}, //application's settings
});
```

#### How to define a Component
```javascript
import { defineComponent } from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";

defineComponent({
  tag: "my-html-tag",
  code: `<div></div>`,
  options: {
    properties: [], //list of html attributes that inherit values from the parent virtual node
    dataset: {}, //data set used in the component
    computed: {}, //dynamically defined read-only datasets while using the component
    actions: {}, //set of component functions
    events: [], //trigger of component events
    settings: {}, //component's settings
  },
});

```
### SERVER MODULE

### USER MODULE

## WHY LAMPREDOTTO JS 

