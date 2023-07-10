import { vNode } from "./virtualizer.js";
import EventHandler from "./events.js";
import { Support } from "./library.js";
import { Collection } from "./enumerators.js";
import log from "./console.js";
class Application {
    name = "";
    context = {};
    vdom = undefined;
    settings = {
        debug: false,
        debug_mode: Collection.debug_mode.all,
        darkmode: false
    };
    handler = new EventHandler();
    _state = Collection.lifecycle.initialized;
    get state() { return this._state; }
    set state(value) {
        this._state = value;
        this.handler.trigger(Collection.application_event.progress, value);
    }
    reactivity = {
        handler: this.handler
    };
    constructor(id) {
        this.state = Collection.lifecycle.creating;
        this.defaultEvents();
        this.name = id;
        this.state = Collection.lifecycle.created;
    }
    /**Build the application */
    async build(options) {
        try {
            this.state = Collection.lifecycle.setup;
            //display loading screen
            if (options.settings)
                this.settings = options.settings;
            this.setupEvents(options.events);
            this.virtualizeDom();
            this.buildContext(options.dataset ? options.dataset : {}, options.actions, options.computed).then((app) => {
                if (app.vdom) {
                    app.handler.trigger(Collection.application_event.render, this);
                    app.vdom?.elaborate(this.context, this.settings); //render virtual document
                }
                //remove loading screen
                this.state = Collection.lifecycle.mounted;
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    virtualizeDom() {
        this.state = Collection.lifecycle.mounting;
        let _root = document.getElementById(this.name);
        if (_root != null) {
            this.vdom = vNode.newInstance(_root, this.settings);
            this.vdom.setup();
        }
        else {
            log("Impossible to find element with id '" + this.name + "'", Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    dismiss() {
        this.state = Collection.lifecycle.unmounting;
        this.state = Collection.lifecycle.unmounted;
    }
    //#region DATA
    async buildContext(dataset, actions, getters) {
        return Support.elaborateContext(dataset, this.reactivity, actions, getters).then((output) => {
            this.context = output;
            return this;
        });
    }
    //#endregion
    //#region EVENTS
    defaultEvents() {
        this.onProgress((state, message) => {
            if (Support.debug(this.settings, Collection.debug_mode.message))
                log("Application " + this.name + " changed to '" + state + (message ? " with message '" + message + "'" : ""));
            switch (state) {
                case Collection.lifecycle[Collection.lifecycle.created]:
                    if (this.settings.debug)
                        console.clear();
                    break;
                case Collection.lifecycle[Collection.lifecycle.updating]:
                    if (this.settings.debug && this.settings.debug_mode == Collection.debug_mode.command)
                        console.clear();
                    break;
                case Collection.lifecycle[Collection.lifecycle.updated]:
                    if (this.settings.debug && this.settings.debug_mode == this.name) {
                        console.clear();
                        log(this.vdom, Collection.message_type.debug);
                    }
                    break;
                case Collection.lifecycle[Collection.lifecycle.mounted]:
                    if (Support.debug(this.settings, this.name)) {
                        log(this.vdom, Collection.message_type.debug);
                    }
                    break;
            }
        });
        this.onChange((options) => {
            this.vdom?.update(true, options);
        });
    }
    setupEvents(events) {
        if (events) {
            for (let evt of events) {
                this.handler.on(evt.name, async function () { return evt.action(); });
            }
        }
    }
    onProgress(action) {
        this.handler.on(Collection.application_event.progress, async function (state) { return action(Collection.lifecycle[state]); });
    }
    onChange(action) {
        this.handler.on(Collection.application_event.update, async function (state) { return action(Collection.lifecycle[state]); });
    }
}
export { Application };
