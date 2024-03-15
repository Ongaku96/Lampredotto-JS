import "./modules/global.js";
import "./components/DefaultComponents.js";
import EventHandler from "./modules/events.js";
import { ApplicationBuilder } from "./modules/types.js";
import { Collection } from "./modules/enumerators.js";
import { Application } from "./modules/application.js";
import log from "./modules/console.js";
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
export function defineComponent(component) {
    var templateString = "";
    var styleString = component.styles || [];
    if (component.templatePath) {
        fetch(component.templatePath).then(response => response.text()).then((data) => { templateString = data; });
    }
    setupComponent(component.selector, component.template || templateString, component.options || {});
    for (const style of styleString) {
        styleComponent(style);
    }
    ;
}
/**Get Component elaborated from server */
export function serverComponent(url, timeoutConnection = 30000) {
    const request = () => {
        let controller = new AbortController();
        setTimeout(() => { controller.abort(); }, timeoutConnection);
        return fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application-json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            signal: controller.signal,
        });
    };
    try {
        return request().then((response) => {
            if (response.ok) {
                response.json().then((template) => {
                    if ("tag" in template && "code" in template)
                        defineComponent(template);
                    else
                        log(`Impossible to define as component: ${JSON.stringify(template)}`, Collection.message_type.warning);
                });
            }
            else {
                log(response.text, Collection.message_type.server_error);
                throw response;
            }
            return response;
        });
    }
    catch (ex) {
        log(ex, Collection.message_type.error);
        throw ex;
    }
}
