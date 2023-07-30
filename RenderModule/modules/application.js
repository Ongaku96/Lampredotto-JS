import { vNode } from "./virtualizer.js";
import EventHandler from "./events.js";
import { View, Support } from "./library.js";
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
            this.applySettings();
            this.setupEvents(options.events);
            this.virtualizeDom();
            this.buildContext(options.dataset ? options.dataset : {}, options.actions, options.computed).then((app) => {
                if (app.vdom) {
                    app.handler.trigger(Collection.application_event.render, this);
                    app.vdom?.elaborate(this.context); //render virtual document
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
            this.vdom = vNode.newInstance(_root, undefined, this.settings);
            this.vdom.setup();
        }
        else {
            log("Impossible to find element with id '" + this.name + "'", Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    applySettings() {
        if (this.settings.interface?.palette) {
            for (const c of this.settings.interface?.palette) {
                updateGlobalStyle(c.name, c.color);
            }
        }
        if (this.settings.interface?.radius)
            document.documentElement.style.setProperty(`--global-radius`, this.settings.interface.radius);
        if (this.settings.interface?.padding)
            document.documentElement.style.setProperty(`--global-padding`, this.settings.interface.padding);
        if (this.settings.interface?.margin)
            document.documentElement.style.setProperty(`--global-margin`, this.settings.interface.margin);
        if (this.settings.interface?.timer)
            document.documentElement.style.setProperty(`--global-timer`, this.settings.interface.timer);
        if (this.settings.interface?.timer)
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
                document.documentElement.style.setProperty(`--${name}-a`, "1");
            }
        }
    }
    dismiss() {
        this.state = Collection.lifecycle.unmounting;
        this.state = Collection.lifecycle.unmounted;
    }
    //#region DATA
    async buildContext(dataset, actions, getters) {
        if (dataset.darkmode == null)
            dataset.darkmode = function () { View.darkmode(); };
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
        this.onChange(() => {
            this.vdom?.update();
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
