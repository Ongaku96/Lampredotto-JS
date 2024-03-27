import "./global.js";
import { Collection } from "./enumerators.js";
import { Support } from "./library.js";
import log from "./console.js";
/**Application interaction management */
class ApplicationBuilder {
    application;
    get app() { return this.application; }
    constructor(application) {
        this.application = application;
    }
    /**Virtualize DOM and render data on page */
    build(options = {}) {
        try {
            this.application.virtualize().then(() => {
                this.application.build(options).then(() => {
                    this.application.elaborate();
                });
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        finally {
            return this.application;
        }
    }
    /**Update dataset and refresh render */
    update(options) {
        try {
            this.application.build(options).then(() => {
                this.application.update();
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        finally {
            return this.application;
        }
    }
    /**Remove rendering and reset dataset */
    dismiss() {
        try {
            this.application.dismiss();
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        finally {
            return this.application;
        }
    }
}
/**Represent a dynamic action that can be bound to an event and converted to json*/
class StringAction {
    name;
    type;
    data;
    constructor(name, type, options) {
        this.name = name;
        this.type = type;
        this.data = options;
    }
    /**Execute the action */
    run(...args) {
        switch (this.type) {
            case Collection.action_type.link:
                if (this.data && "link" in this.data) {
                    try {
                        if (args && args.length > 0)
                            this.data.link = this.data.link.format(...args);
                        window.open(this.data.link, "_blank");
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
                else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            case Collection.action_type.code:
                if (this.data && "script" in this.data) {
                    try {
                        if (this.data.args)
                            args.push(...this.data.args);
                        Support.runFunctionByString(this.data.script.format(...args), {});
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
                else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            case Collection.action_type.server:
                if (this.data && "action" in this.data) {
                    try {
                        if (args && args.length > 0) {
                            switch (args.length) {
                                case 1:
                                    //__server.script(args[0]);
                                    break;
                                case 2:
                                    //__server.script(args[0], args[1]);
                                    break;
                                case 3:
                                    // __server.script(args[0], args[1], function (result) {
                                    //     args[2](result);
                                    // });
                                    break;
                            }
                        }
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
                else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            case Collection.action_type.email:
                if (this.data && "to" in this.data) {
                    try {
                        let _to = this.data.to;
                        let _cc = this.data.cc ? "?cc=" + this.data.cc : "";
                        let subject = this.data.subject
                            ? "&subject=" + this.data.subject
                            : "";
                        if (args && args.length > 0)
                            subject = subject.format(...args);
                        window.open("mailto:" + _to + _cc + subject, "_blank");
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
                else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            default:
                if (typeof this.data == 'function')
                    this.data.call({}, ...args);
                break;
        }
    }
    /**Get Action object from json */
    static load(json) {
        try {
            let _data = JSON.parse(json);
            return _data ? new StringAction(_data.name, _data.type, _data.options) : undefined;
        }
        catch (ex) {
            console.error(ex);
            return undefined;
        }
    }
}
/**
 * Interface for starting the component by class
 * @date 27/3/2024 - 11:32:29
 *
 * @abstract
 * @class iComponent
 * @typedef {iComponent}
 * @implements {DataCollection}
 * @implements {iNodeReferences}
 */
class iComponent {
    _inputs = [];
    get inputs() { return this._inputs || []; }
    get events() {
        let _ref = this;
        let _base = {
            name: Collection.node_event.progress,
            action: async function (state) { _ref.onProgress(state); }
        };
        let _event_list = this.nodeEvents ? this.nodeEvents() : [];
        _event_list.push(_base);
        return _event_list;
    }
    get settings() { return this.nodeSettings ? this.nodeSettings() : new Settings(); }
    __app;
    __element;
    __node;
    constructor(...inputs) {
        this._inputs = inputs;
    }
    /**!OBSOLETE! - Convert object properties to TemplateOptions */
    toTemplateOptions() {
        var props = Object.getOwnPropertyNames(this);
        // var actions = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        var options = {
            inputs: this.inputs,
            dataset: {},
            computed: {},
            actions: {},
            events: this.events,
            settings: this.settings,
        };
        props.forEach((key) => {
            if (key != "properties") {
                var desc = Object.getOwnPropertyDescriptor(this, key);
                if (desc && "get" in desc) {
                    Reflect.set(options.computed, key, desc.get);
                }
                else {
                    if (options.dataset)
                        Reflect.set(options.dataset, key, Reflect.get(this, key));
                }
            }
        });
        // actions = actions.filter(a => a !== "getComponentOptions" &&
        //     a !== "settings" &&
        //     a !== "events" &&
        //     a !== "constructor");
        var clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete clone.getComponentOptions;
        delete clone.settings;
        delete clone.events;
        delete clone.constructor;
        for (const key of props) {
            delete clone[key];
        }
        options.actions = clone;
        return options;
    }
    //#endregion
    onProgress(state) {
        switch (state) {
            case Collection.lifecycle.creating:
                if ("onCreating" in this)
                    this.onCreating.call(this);
                break;
            case Collection.lifecycle.created:
                if ("onCreated" in this)
                    this.onCreated.call(this);
                break;
            case Collection.lifecycle.mounting:
                if ("onMounting" in this)
                    this.onMounting.call(this);
                break;
            case Collection.lifecycle.mounted:
                if ("onMounted" in this)
                    this.onMounted.call(this);
                break;
            case Collection.lifecycle.context_creating:
                if ("onContextCreating" in this)
                    this.onContextCreating.call(this);
                break;
            case Collection.lifecycle.context_created:
                if ("onContextCreated" in this)
                    this.onContextCreated.call(this);
                break;
            case Collection.lifecycle.updating:
                if ("onUpdating" in this)
                    this.onUpdating.call(this);
                break;
            case Collection.lifecycle.updated:
                if ("onUpdated" in this)
                    this.onUpdated.call(this);
                break;
            case Collection.lifecycle.ready:
                if ("onReady" in this)
                    this.onReady.call(this);
                break;
        }
    }
    clone() {
        return new this.constructor();
    }
}
//#region INTERFACES
/**Framework Settings */
class Settings {
    debug;
    debug_mode;
    formatters;
    interface;
    constructor(_default) {
        if (_default) {
            if (_default?.debug != null)
                this.debug = _default?.debug;
            if (_default?.debug_mode != null)
                this.debug_mode = _default?.debug_mode;
            if (_default?.formatters != null)
                this.formatters = _default?.formatters;
            if (_default?.interface != null)
                this.interface = _default?.interface;
        }
    }
    merge(settings) {
        /**Merge parent Settings with personal settings */
        if (settings.debug != null)
            this.debug = settings.debug;
        if (settings.debug_mode != null)
            this.debug_mode = settings.debug_mode;
        if (this.formatters == null)
            this.formatters = [];
        if (settings.formatters) {
            for (const formatter of settings.formatters) {
                this.formatters = this.formatters.filter(f => f.type !== formatter.type);
                this.formatters.push(formatter);
            }
        }
        if (settings.interface)
            this.interface = settings.interface;
    }
}
export { Settings, StringAction, ApplicationBuilder, iComponent }; //classes
