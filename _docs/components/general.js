import { defineComponent } from "../../RenderModule/LampRender.js";

defineComponent({
    tag: "lamp-card",
    code:
        `
            <div card>
                <section header>
                    <span card-icon cmd-if='icon' class='material-symbols-outlined'>{{ icon }}</span>
                    <h2 cmd-if='title'>{{ title }}</h2>
                    <h4 cmd-if='subtitle'>{{ subtitle }}</h4>
                </section>
                <section content>
                    <p>{{ content }}</p>
                </section>
            </div>
        `,
    options: {
        properties: ["title", "subtitle", "icon", "content"]
    }
});

defineComponent({
    tag: "lamp-description",
    code:
        `
            <lamp-card cmd-bind:title='title' cmd-bind:content='description' cmd-bind:icon='terminal'></lamp-card>
        `,
    options: {
        dataset: {
            title: "Lampredotto JS",
            description: "Lampredotto js is a JavaScript framework designed in specialised modules for various functionalities useful for the realisation of front-end projects.",
        }
    }
});