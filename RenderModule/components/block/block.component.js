import { defineComponent } from "../../LampRender.js";

defineComponent({
    selector: "lamp-block",
    template: "<div lamp-block></div>",
    styles: [`
    [lamp-block] {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    border-radius: var(--global-radius);
}

[lamp-block]>* {
    flex-grow: 1;
    border-radius: 0 !important;
    margin: 0 !important;
}

[lamp-block]>*:first-child {
    border-radius: var(--global-radius) 0 0 var(--global-radius) !important;
}

[lamp-block]>*:last-child {
    border-radius: 0 var(--global-radius) var(--global-radius) 0 !important;
}
    `],
});