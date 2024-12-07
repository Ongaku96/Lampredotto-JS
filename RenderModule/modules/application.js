import { vNode } from "./virtualizer.js";
import EventHandler from "./events.js";
import { Support } from "./library.js";
import { Settings } from "./types.js";
import { Collection } from "./enumerators.js";
import log from "./console.js";
import { react, valueIsNotReactive } from "./reactive.js";
import TaskManager from "./pipeline.js";
class Application {
    name = ""; //id of application
    context = {}; //data context
    vdom = undefined; //virtual DOM
    settings = new Settings({ debug: true }); //Application settings
    storage = {};
    handler = new EventHandler(); //events collector
    pipeline = new TaskManager(); //update pipeline
    _state = Collection.lifecycle.initialized; //application state
    get state() { return this._state; }
    set state(value) {
        this._state = value;
        this.handler.trigger(Collection.application_event.progress, this.state);
    }
    _reactivity = {
        handler: this.handler
    };
    get reactivity() { return this._reactivity; } //Proxy rules set
    constructor(id) {
        this.defaultEvents();
        this.name = id;
    }
    //#region LIFECYCLE
    /**Create a linked virtual version of HTML DOM */
    async virtualize() {
        this.state = Collection.lifecycle.creating;
        await this.virtualizeDom();
        this.state = Collection.lifecycle.created;
    }
    /**Build the application */
    async build(options = {}) {
        try {
            if (options && options?.settings)
                this.settings.merge(options.settings);
            this.applySettings();
            if (options && options.events)
                this.setupEvents(...options.events);
            this.storage = options?.storage ? Support.deepClone(options.storage) : {};
            return await this.buildContext(options?.dataset ? options.dataset : {}, options?.actions, options?.computed);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
            throw ex;
        }
    }
    /**Create a linked virtual version of HTML DOM */
    async virtualizeDom() {
        let _seed = document.getElementById(this.name);
        if (_seed != null && this.vdom == null) {
            this.vdom = vNode.newInstance(_seed, undefined);
            await this.vdom.setup();
            this.state = Collection.lifecycle.setup;
        }
        else {
            log("Impossible to find element with id '" + this.name + "'", Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**First application's virtual DOM render*/
    async elaborate() {
        try {
            this.state = Collection.lifecycle.mounting;
            this.vdom?.updateSettings(new Settings({ debug: this.settings.debug, debug_mode: this.settings.debug_mode, formatters: this.settings.formatters }));
            await this.vdom?.elaborate(this.context, this.storage);
            this.state = Collection.lifecycle.mounted;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
        finally {
            this.handler.trigger(Collection.application_event.render, this);
        }
    }
    /**Update rendering */
    update() {
        try {
            this.state = Collection.lifecycle.updating;
            this.vdom?.update().then(() => {
                this.state = Collection.lifecycle.updated;
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
        finally {
            this.handler.trigger(Collection.application_event.render, this);
        }
    }
    /**Reset virtualization */
    async dismiss() {
        this.state = Collection.lifecycle.unmounting;
        await this.vdom?.dismiss();
        this.context = {};
        this.settings = new Settings({ debug: true });
        this.state = Collection.lifecycle.unmounted;
    }
    //#endregion
    //#region SETTINGS
    /**Setup global settings for interface and format*/
    applySettings() {
        if (this.settings.interface?.palette) {
            for (const c of this.settings.interface?.palette) {
                updateGlobalStyle(c.name, c.color);
            }
        }
        switch (this.settings.interface?.animation) {
            case "slower":
                document.documentElement.style.setProperty(`--global-animation`, "5s");
                break;
            case "slow":
                document.documentElement.style.setProperty(`--global-animation`, "4s");
                break;
            case "fast":
                document.documentElement.style.setProperty(`--global-animation`, "3s");
                break;
            case "faster":
                document.documentElement.style.setProperty(`--global-animation`, "1s");
                break;
            case "unset":
                document.documentElement.style.setProperty(`--global-animation`, "0s");
                break;
        }
        if (this.settings.interface?.radius)
            document.documentElement.style.setProperty(`--global-radius`, this.settings.interface.radius);
        if (this.settings.interface?.animation)
            document.documentElement.style.setProperty(`--global-animation`, this.settings.interface.animation);
        if (this.settings.interface?.font)
            document.documentElement.style.setProperty(`--global-font`, this.settings.interface.font);
        function updateGlobalStyle(name, hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                var r = parseInt(result[1], 16);
                var g = parseInt(result[2], 16);
                var b = parseInt(result[3], 16);
                r /= 255, g /= 255, b /= 255;
                var max = Math.max(r, g, b), min = Math.min(r, g, b);
                var h, s, l = (max + min) / 2;
                if (max == min) {
                    h = s = 0; // achromatic
                }
                else {
                    var d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r:
                            h = (g - b) / d + (g < b ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        case b:
                            h = (r - g) / d + 4;
                            break;
                        default:
                            h = 0;
                            break;
                    }
                    h /= 6;
                }
                s = s * 100;
                s = Math.round(s);
                l = l * 100;
                l = Math.round(l);
                h = Math.round(360 * h);
                document.documentElement.style.setProperty(`--${name}-h`, `${h}deg`);
                document.documentElement.style.setProperty(`--${name}-s`, `${s}%`);
                document.documentElement.style.setProperty(`--${name}-l`, `${l}%`);
            }
            document.documentElement.style.setProperty(`--${name}-a`, hex == "" || hex == "transparent" ? "0" : "1");
        }
        document.body.setAttribute("theme", this.settings.interface?.darkmode ? "dark" : "");
    }
    /**Update interface settings */
    updateSettings(settings) {
        if (settings.interface)
            this.settings.interface = settings.interface;
        this.applySettings();
    }
    //#endregion
    //#region DATA
    /**Define unique data context from options */
    async buildContext(dataset, actions, getters) {
        return Support.elaborateContext(this.context, dataset, this.reactivity, actions, getters).then((output) => {
            if (valueIsNotReactive(output))
                output = react(output, this.reactivity);
            let app = this;
            Object.defineProperty(output, Collection.KeyWords.app, { get() { return app; } }); //in-context virtual node reference shortcut
            Object.defineProperty(output, Collection.KeyWords.node, { get() { return app.vdom; } }); //in-context application reference
            Object.defineProperty(output, Collection.KeyWords.reference, { get() { return app.vdom?.firstChild; } }); //in-context html node reference
            Object.defineProperty(output, Collection.KeyWords.storage, { get() { return app.storage; } }); //in-context html node reference
            this.context = output;
            return this;
        });
    }
    /**Reset data context */
    resetContext() {
        this.context = {};
        this.storage = {};
    }
    //#endregion
    //#region EVENTS
    /**setup default events triggers */
    defaultEvents() {
        this.onProgress((state, message) => {
            if (Support.debug(this.settings, Collection.debug_mode.message))
                log("Application [" + this.name + "] changed to '" + state + (message ? " with message '" + message + "'" : ""));
            document.dispatchEvent(new CustomEvent("lamp", { detail: this, cancelable: true, }));
            document.dispatchEvent(new CustomEvent("lamp", { detail: this, cancelable: true, }));
            switch (state) {
                case Collection.lifecycle.updating:
                    if (Support.debug(this.settings, Collection.debug_mode.command))
                        console.clear();
                    break;
                case Collection.lifecycle.updated:
                    if (Support.debug(this.settings, this.name)) {
                        console.clear();
                        log(this.vdom, Collection.message_type.debug);
                    }
                    break;
                case Collection.lifecycle.mounted:
                    if (Support.debug(this.settings, this.name))
                        log(this.vdom, Collection.message_type.debug);
                    break;
            }
        });
        this.onChange(() => {
            if (this.vdom != null)
                this.pipeline.add(() => {
                    return this.vdom?.update();
                });
        });
    }
    /**Add events */
    setupEvents(...events) {
        if (events) {
            let _me = this;
            for (let evt of events) {
                this.handler.on(evt.name, function (...args) { return evt.action.call(_me.context, ...args); });
            }
        }
    }
    /**Set on state change event action*/
    onProgress(action) {
        this.handler.on(Collection.application_event.progress, async function (state) { return action(state); });
    }
    /**Set on data context change event action*/
    onChange(action) {
        this.handler.on(Collection.application_event.update, async function (state) { return action(state); });
    }
}
export { Application };
