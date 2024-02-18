import { defineComponent } from "../LampRender.js";
defineComponent({
    tag: "lamp-block",
    code: `<div block></div>`
}, `div[block] {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        border-radius: var(--global-radius);

        & > * {
            flex-grow: 1;
            border-radius: 0 !important;
            margin: 0 !important;

            &:first-child {
                border-radius: var(--global-radius) 0 0 var(--global-radius) !important;
            }

            &:last-child {
                border-radius: 0 var(--global-radius) var(--global-radius) 0 !important;
            }
        }
    }`);
