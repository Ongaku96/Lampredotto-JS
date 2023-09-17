import { defineComponent } from "../LampRender.js";
defineComponent({
    tag: "lamp-block",
    code: `<div block></div>`
}, `div[block] {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;

        & > * {
            flex-grow: auto;
            border-radius: 0;
            margin: 0;

            &:first-child {
                border-radius: var(--global-radius) 0 0 var(--global-radius);
            }

            &:last-child {
                border-radius: 0 var(--global-radius) var(--global-radius) 0;
            }
        }
    }`);
