import "./modules/global.js";
import "./components/default.components.js";
import EventHandler from "./modules/events.js";
import { ApplicationBuilder } from "./modules/types.js";
import { Collection } from "./modules/enumerators.js";
import { Application } from "./modules/application.js";
import { log } from "./modules/console.js";
import { setupComponent, styleComponent } from "./modules/templates.js";
/**Lampredotto framework */
export default class RenderEngine {
    static _instance;
    handler = new EventHandler();
    /**Singleton instance of framework */
    static get instance() {
        try {
            if (RenderEngine._instance == null) {
                RenderEngine._instance = new RenderEngine();
                RenderEngine._instance.handler.trigger(Collection.lifecycle.created.toString());
            }
            return RenderEngine._instance;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            return null;
        }
    }
    constructor() {
        this.setupEvents();
        this.handler.trigger(Collection.lifecycle.creating.toString());
    }
    setupEvents() {
        document.addEventListener(Collection.application_event.component, (evt) => {
            Array.from(document.querySelectorAll(evt.detail)).forEach(element => {
                if ("virtual" in element)
                    element?.virtual?.update();
            });
        });
        this.handler.on(Collection.lifecycle.creating.toString(), async () => {
            //console.clear();
            log("Building API...");
        });
        this.handler.on(Collection.lifecycle.created.toString(), async () => {
            //console.clear();
            log("API are ready to use");
        });
    }
    /**Start new application */
    start(id) {
        return new ApplicationBuilder(new Application(id));
    }
}
/**Define new Component by template*/
export async function defineComponent(component) {
    if (component.selector) {
        var template = component.template || "";
        var styles = component.styles || [];
        if (component.templatePath) {
            await fetch(component.templatePath)
                .then(res => res.ok ? res.text() : component.template)
                .then((code) => { template = code || ""; });
        }
        if (component.stylesPath) {
            await fetch(component.stylesPath)
                .then(res => res.ok ? res.text() : null)
                .then((css) => { styles = css ? [css] : component.styles || []; });
        }
        setupComponent(component.selector, template, component.options || component.class || {});
        for (const style of styles) {
            styleComponent(style);
        }
        ;
        document.dispatchEvent(new CustomEvent("component", { detail: component.selector }));
    }
    else {
        log(`Impossible to define component: ${JSON.stringify(component)}`, Collection.message_type.warning);
    }
}
/**Get Component elaborated from server */
export async function serverComponent(url, timeoutConnection = 30000) {
    const request = () => {
        let controller = new AbortController();
        setTimeout(() => { controller.abort(); }, timeoutConnection);
        return fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            signal: controller.signal,
        });
    };
    try {
        await request()
            .then(res => res.ok ? res.json() : log(res.text, Collection.message_type.server_error))
            .then(component => defineComponent(component));
    }
    catch (ex) {
        log(ex, Collection.message_type.error);
    }
}
/**Decorator for component initialization */
export function lampComponent(args) {
    return (constructor) => {
        if (args.selector) {
            defineComponent({
                selector: args.selector,
                template: args.template,
                templatePath: args.templatePath,
                styles: args.styles,
                stylesPath: args.stylesPath,
                class: Object.create(constructor.prototype).clone()
            });
        }
    };
}
