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
  code: `<html>`,
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
Interaction with html elements is defined by commands inspired by Vue.js framework in terms of semantics and functionality.

#### Direct dynamic rendering: 
Using double braces you can implement inline javascript code between html tags. The code inside the double braces is interpreted as a function with return and the result is printed as a string.
``` html
  <div>
    {{this.count > 0 ? "I have the high ground" : "Hello There"}}
  <div>
```

#### Command model
This command allows you to render an application variable or javascript code within the tag it is applied to, it also allows you to render new html code.
``` html
  <div cmd-model='count'><div> /** <div>0</div> **/
  <div cmd-model='$.count + 1'><div> /** <div>1</div> **/
```
Il comando permette anche di sincronizzare i valori delle variabili del dataset con elementi di input.

``` html
  <input id='test_model' type='text' cmd-model='count'/> /** document.getElementById('test_model').value => '0' **/
```
#### Command bind
#### Command on
#### Command if
#### Command for


### SERVER MODULE



### USER MODULE

## WHY LAMPREDOTTO JS 

