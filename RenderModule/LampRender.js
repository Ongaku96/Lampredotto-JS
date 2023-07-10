import "./modules/global.js";
import EventHandler from "./modules/events.js";
import { ApplicationBuilder } from "./modules/types.js";
import { Collection } from "./modules/enumerators.js";
import { Application } from "./modules/application.js";
import log from "./modules/console.js";
/**Lampredotto framework */
export default class LampRender {
    static _instance;
    handler = new EventHandler();
    /**Singleton instance of framework */
    static get instance() {
        try {
            if (LampRender._instance == null) {
                LampRender._instance = new LampRender();
                LampRender._instance.handler.trigger(Collection.lifecycle.created.toString());
            }
            return LampRender._instance;
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
            console.clear();
            log("Building API...");
        });
        this.handler.on(Collection.lifecycle.created.toString(), async () => {
            console.clear();
            log("API are ready to use");
        });
    }
    /**Start new application */
    start(id) {
        return new ApplicationBuilder(new Application(id));
    }
}
