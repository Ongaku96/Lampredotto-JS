![alt text](https://www.marcobiagini.altervista.org/Projects/LampredottoJS/resources/darkcover%20Lamp.png "Lampredotto Cover")

# LAMPREDOTTO JS

Lampredotto JS is a set of specialised Javascript modules useful in the realisation of a Front End project.

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

```typescript
import { defineComponent } from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";

defineComponent({
  selector: string,
  template?: string,
  templatePath?: string,
  styles?: string[],
  stylesPath?: string,
  options?: {
    inputs: [], //list of html attributes that inherit values from the parent context
    dataset: {}, //data set used in the component
    computed: {}, //dynamically defined read-only datasets while using the component
    actions: {}, //set of component functions
    events: [], //trigger of component events
    settings: {}, //component's settings
  },
  class?: iComponent //new instance of a class that extend iComponent interface.
});

```

How to implement Component's options by extending iComponent class

```javascript

import { defineComponent } from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";
import { iComponent } from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/modules/types.js";
class MyComponent extends iComponent{
  constructor(){
    super("input1", "input2"); //pass component's element attribute names for data binding
    this.prop1 = "value" //set component's Dataset
  }

  get prop2() { return this.prop1; } //set component's computed dataset

  action1(){} //Implement actions

  events() { //override this method to events implementation
    return [];
  }
  settings(){ //override this method for settings
    return {}
  }
}

defineComponent({
  selector: "my-selector",
  template?: "<div></div>",
  styles?: [""],
  class?: new MyComponent()
});

```

Interaction with html elements is defined by commands inspired by Vue.js framework in terms of semantics and functionality.

#### Direct dynamic rendering

Using double braces you can implement inline javascript code between html tags. The code inside the double braces is interpreted as a function with return and the result is appended into the parent node.

``` html
  <div>
    {{this.count > 0 ? "I have the high ground" : "Hello There"}} <!-- Hello There -->
  <div>
  <script type='module'>
    import RenderModule from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";

    const controller = RenderEngine.instance.start("app").build({
      dataset: {
        count: 0,
      }
    });
  </script>
```

> [!NOTE]
> You can use a shortcut by replacing the keyword 'this' with the dollar sign '$'

#### Command model

This command allows you to render an application variable or javascript code within the tag it is applied to.

``` html
  <div cmd-model='count'><div> <!-- 0 -->
  <div cmd-model='$.count + 1'><div> <!-- 1 -->
```

> [!NOTE]
> The command also allows synchronizing the values of dataset variables with input elements.

``` html
  <input id='test_model' type='text' cmd-model='count'/> <!-- document.getElementById('test_model').value => '0' -->
```

#### Command bind

The bind command allows the attributes of html tags to be made dynamic.
To use the command, a shortcut can be exploited by using ':' before the attribute name.

``` html
  <div cmd-bind:data-value='count'><div>
  <div :data-value='count'><div>
  <!-- <div data-value='0'><div> -->
```

#### Command on

The on command allows an application action to be applied to a DOM element through an event.
To use the command, a shortcut can be exploited by using '@' before the event name.

``` html
  <button cmd-on:click='$.count++'>Count: {{count}}<button>
  <button @click='$.count++'>Count: {{count}}<button>
```

#### Command if

The if command allows conditional rendering of an HTML element.
Depending on the Boolean condition set, the element will be dynamically rendered or commented out within the DOM.

``` html
  <div cmd-if='$.count > 1'>I have {{count}} high grounds<div>
  <div cmd-elseif='$.count == 0'>Hello There<div>
  <div cmd-else><div>
  <!-- Hello There -->
```

> [!IMPORTANT]
> The if, elseif and else commands must all be children of the same container to be considered as an instruction block.

#### Command for

The for command allows you to replicate a page element based on a list within the application.

``` html
  <div cmd-for='item in list'>{{:index}}: {{item}},<div>
    <!-- 0: Item 1, 1: Item 2, 2: Item 3, -->

  <script type='module'>
    import RenderModule from "https://cdn.jsdelivr.net/gh/Ongaku96/LAMP/RenderModule/LampRender.js";

    const controller = RenderEngine.instance.start("app").build({
      dataset: {
        list: ["Item 1", "Item 2", "Item 3"],
      }
    });
  </script>
```

Within the for command you can use the alias usaro to iterate the list that references the data iterated within and on the tag of the entire element.
To use the iterate index you must instead use the ':index' keyword.

It is possible to filter the list data with the supplement of the cmd-filter command within which inline javascript functions can be defined.

``` html
  <div cmd-for='item in list' cmd-filter='!$.item.includes("2")'>{{item}},<div> <!-- Item 1, Item 3, -->
```

You can sort the order of appearance of the data with the cmd-sort command by indicating the alias of the iteration

``` html
  <div cmd-for='item in list' cmd-sort:desc='item'>{{item}},<div> <!-- Item 3, Item 2, Item 1 -->
```

> [!TIP]
> Use the desc keyword to sort in descending order. To sort in ascending order instead, do not apply the modifier

> [!CAUTION]
>The for command creates a duplicate of the application's data context before iterating the list. This results in changes from outside the command updating the rendering while changes inside the for are unresponsive.

### SERVER MODULE

- [x] stable version
- [X] to comment on
- [ ] to be tested
- [ ] to be documented

### USER MODULE

- [x] stable version
- [ ] to comment on
- [ ] to be tested
- [ ] to be documented

## WHY LAMPREDOTTO JS

Lampredotto JS is a set of easy-to-understand and easy-to-use development tools with the goal of simplifying and speeding up the development of web interfaces.
