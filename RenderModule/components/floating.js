import { defineComponent } from "../LampRender.js";
defineComponent({
    tag: "float-container",
    code: `<div float-container='hide'></div>`
}, `*[floating-item] {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        max-height: 500px;
        overflow-y: auto;
        @include elevated();
    }

    div[float-container] {
        position: relative;
    }

    div[float-container='hide'] {
        &>*[floating-item] {
            display: none;
        }
    }

    div[float-container='show'] {
        &>*[floating-item] {
            display: block;
        }
    }`);
