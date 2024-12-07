import { defineComponent } from "../../LampRender.js";

defineComponent({
    selector: "group-component",
    template: "<div group-component></div>",
    styles: [`[group-component]{display:flex;flex-direction: row;justify-content: center;align-items: center;border-radius:var(--global-radius);}`,
        `[group-component]>*{flex-grow:1;border-radius:0 !important;margin:0 !important;}`,
        `[group-component]>*:first-child{border-radius:var(--global-radius) 0 0 var(--global-radius) !important;}`,
        `[group-component]>*:last-child{border-radius:0 var(--global-radius) var(--global-radius) 0 !important;}`,],
});