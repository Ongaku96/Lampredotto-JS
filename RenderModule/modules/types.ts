import "./global.js";
import { vNode } from "./virtualizer.js";
import { Collection } from "./enumerators.js";
import { Support } from "./library.js";
import { Application } from "./application.js";
import EventHandler from "./events.js";
import log from "./console.js";
/**Application interaction management */
class ApplicationBuilder {

    private application: Application;
    public get app(): Application { return this.application; }

    constructor(application: Application) {
        this.application = application;
    }
    /**Virtualize DOM and render data on page */
    build(options: TemplateOptions = {}): Application {
        try {
            this.application.virtualize().then(() => {
                this.application.build(options).then(() => {
                    this.application.elaborate();
                })
            });
        } catch (ex) {
            log(ex, Collection.message_type.error);
        } finally {
            return this.application;
        }
    }
    /**Update dataset and refresh render */
    update(options: TemplateOptions) {
        try {
            this.application.build(options).then(() => {
                this.application.update();
            });
        } catch (ex) {
            log(ex, Collection.message_type.error);
        } finally {
            return this.application;
        }
    }
    /**Remove rendering and reset dataset */
    dismiss() {
        try {
            this.application.dismiss();
        } catch (ex) {
            log(ex, Collection.message_type.error);
        } finally {
            return this.application;
        }
    }

}
type ActionLink = {
    link: string,
    type: "ActionLink"
}
type ActionScript = {
    script: string,
    args?: any,
    type: "ActionScript"
}
type ActionServer = {
    action: string,
    data?: any,
    type: "ActionServer"
}
type ActionEmail = {
    to: string,
    cc?: string,
    subject?: string,
    body?: string,
    type: "ActionEmail"
}
/**Represent a dynamic action that can be bound to an event and converted to json*/
class StringAction {
    public name: string;
    public type: Collection.action_type;
    public data?: ActionLink | ActionScript | ActionServer | ActionEmail | Function | undefined;

    constructor(name: string, type: Collection.action_type, options?: ActionLink | ActionScript | ActionServer | ActionEmail | Function | undefined) {
        this.name = name;
        this.type = type;
        this.data = options;
    }
    /**Execute the action */
    run(...args: any[]) {
        switch (this.type) {
            case Collection.action_type.link:
                if (this.data && "link" in this.data) {
                    try {
                        if (args && args.length > 0) this.data.link = this.data.link.format(...args);
                        window.open(this.data.link, "_blank");
                    } catch (ex) {
                        console.error(ex);
                    }
                } else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            case Collection.action_type.code:
                if (this.data && "script" in this.data) {
                    try {
                        if (this.data.args) args.push(...this.data.args);
                        Support.runFunctionByString(this.data.script.format(...args), {});
                    } catch (ex) {
                        console.error(ex);
                    }
                } else {
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
                    } catch (ex) {
                        console.error(ex);
                    }
                } else {
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
                        if (args && args.length > 0) subject = subject.format(...args);
                        window.open("mailto:" + _to + _cc + subject, "_blank");
                    } catch (ex) {
                        console.error(ex);
                    }
                } else {
                    console.warn("Unable to use the passed object: " + JSON.stringify(this.data));
                }
                break;
            default:
                if (typeof this.data == 'function') this.data.call({}, ...args);
                break;
        }
    }
    /**Get Action object from json */
    static load(json: string): StringAction | undefined {
        try {
            let _data = JSON.parse(json);
            return _data ? new StringAction(_data.name, _data.type, _data.options) : undefined;
        } catch (ex) {
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
abstract class iComponent implements DataCollection, iNodeReferences {

    protected _inputs: string[] = [];
    get inputs() { return this._inputs || []; }
    get events() {
        let _ref = this;
        let _base: iEvent<any> = {
            name: Collection.node_event.progress,
            action: async function (state: string) { _ref.onProgress(state); }
        }
        let _event_list: iEvent<any>[] = this.nodeEvents ? this.nodeEvents() : [];
        _event_list.push(_base);

        return _event_list;
    }
    get settings() { return this.nodeSettings ? this.nodeSettings() : new Settings(); }

    __app: Application | undefined;
    __element: Element | undefined;
    __node?: vNode | undefined;

    constructor(...inputs: string[]) {
        this._inputs = inputs;
    }
    /**!OBSOLETE! - Convert object properties to TemplateOptions */
    public toTemplateOptions(): TemplateOptions {
        var props = Object.getOwnPropertyNames(this);
        // var actions = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        var options: TemplateOptions = {
            inputs: this.inputs,
            dataset: {},
            computed: {},
            actions: {},
            events: this.events,
            settings: this.settings,
        }
        props.forEach((key: string) => {
            if (key != "properties") {
                var desc = Object.getOwnPropertyDescriptor(this, key);
                if (desc && "get" in desc) {
                    Reflect.set(options.computed, key, desc.get);
                } else {
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
    //#region ABSTRACT

    /**
     * Define component events list
     * @date 27/3/2024 - 12:24:35
     *
     * @public
     * @abstract
     * @returns {iEvent<any>[]}
     */
    public abstract nodeEvents(): iEvent<any>[];

    /**
     * Define component internal settings
     * @date 27/3/2024 - 12:24:15
     *
     * @public
     * @abstract
     * @returns {Settings}
     */
    public abstract nodeSettings(): Settings;

    /**
     * Executed on Template vNode initialization
     * @date 27/3/2024 - 12:19:57
     *
     * @public
     * @abstract
     */
    public abstract onCreating(): void;

    /**
     * Executed at the end of Template vNode initialization
     * @date 27/3/2024 - 12:20:24
     *
     * @public
     * @abstract
     */
    public abstract onCreated(): void;

    /**
     * Executed before vNode setup
     * @date 27/3/2024 - 12:20:54
     *
     * @public
     * @abstract
     */
    public abstract onMounting(): void;

    /**
     * Executed after vNode setup
     * @date 27/3/2024 - 12:20:54
     *
     * @public
     * @abstract
     */
    public abstract onMounted(): void;

    /**
     * Executed before vNode's context setup
     * @date 27/3/2024 - 12:21:13
     *
     * @public
     * @abstract
     */
    public abstract onContextCreating(): void;

    /**
     * Executed after vNode's context setup
     * @date 27/3/2024 - 12:21:36
     *
     * @public
     * @abstract
     */
    public abstract onContextCreated(): void;

    /**
     * Executed before vNode update at property changes
     * @date 27/3/2024 - 12:21:58
     *
     * @public
     * @abstract
     */
    public abstract onUpdating(): void;

    /**
     * Executed after vNode update
     * @date 27/3/2024 - 12:23:22
     *
     * @public
     * @abstract
     */
    public abstract onUpdated(): void;

    /**
     * Executed on the end of every Template rendering
     * @date 27/3/2024 - 12:23:43
     *
     * @public
     * @abstract
     */
    public abstract onReady(): void;
    //#endregion

    private onProgress(state: string): void {
        switch (state) {
            case Collection.lifecycle.creating:
                if ("onCreating" in this) (<Function>this.onCreating).call(this);
                break;
            case Collection.lifecycle.created:
                if ("onCreated" in this) (<Function>this.onCreated).call(this);
                break;
            case Collection.lifecycle.mounting:
                if ("onMounting" in this) (<Function>this.onMounting).call(this);
                break;
            case Collection.lifecycle.mounted:
                if ("onMounted" in this) (<Function>this.onMounted).call(this);
                break;
            case Collection.lifecycle.context_creating:
                if ("onContextCreating" in this) (<Function>this.onContextCreating).call(this);
                break;
            case Collection.lifecycle.context_created:
                if ("onContextCreated" in this) (<Function>this.onContextCreated).call(this);
                break;
            case Collection.lifecycle.updating:
                if ("onUpdating" in this) (<Function>this.onUpdating).call(this);
                break;
            case Collection.lifecycle.updated:
                if ("onUpdated" in this) (<Function>this.onUpdated).call(this);
                break;
            case Collection.lifecycle.ready:
                if ("onReady" in this) (<Function>this.onReady).call(this);
                break;
        }
    }

    public clone(): this {
        return new (this.constructor as new () => this)();
    }
}

//#region INTERFACES

/**Framework Settings */
class Settings {
    debug?: boolean;
    debug_mode?: string;
    formatters?: Formatter[];
    interface?: ViewSettings;

    constructor(_default?: {
        debug?: boolean,
        debug_mode?: string,
        formatters?: Formatter[],
        interface?: ViewSettings
    }) {
        if (_default) {
            if (_default?.debug != null) this.debug = _default?.debug;
            if (_default?.debug_mode != null) this.debug_mode = _default?.debug_mode;
            if (_default?.formatters != null) this.formatters = _default?.formatters;
            if (_default?.interface != null) this.interface = _default?.interface;
        }
    }

    merge(settings: Settings) {
        /**Merge parent Settings with personal settings */
        if (settings.debug != null) this.debug = settings.debug;
        if (settings.debug_mode != null) this.debug_mode = settings.debug_mode;

        if (this.formatters == null) this.formatters = [];
        if (settings.formatters) {
            for (const formatter of settings.formatters) {
                this.formatters = this.formatters.filter(f => f.type !== formatter.type)
                this.formatters.push(formatter);
            }
        }
        if (settings.interface) this.interface = settings.interface;
    }
}
/**Commands interface */
interface iCommand {
    render(node: vNode): void;
    accept(options: CommandOptions): void;
}
/**Prototype design pattern */
interface iPrototype {
    clone(): iPrototype
}
/**Internal Events interface */
interface iEvent<T> {
    name: string;
    action: (...args: any[]) => Promise<T>;
}
/**Interface for personalized template storage*/
interface iTemplate {
    name: string,
    template: string,
    options?: TemplateOptions
}

interface iNodeReferences {
    __app: Application | undefined,
    __element: Element | undefined,
    __node?: vNode
}

//#endregion

//#region OPTIONS
/**Command's setup type*/
type CommandOptions = {
    attribute: string, //command's supported attribute (ex. on command ON:click -> click is an attribute)
    modifiers: string[], //command's supported personalizations (ex. on command ON -> :click.single would stop event propagation, single is a modifier)
    value: any, //value of command
    nodename: string, //name of tag,
    others?: any
}
/**Proxy and getter-setter setup options */
type ReactivityOptions = {
    get?: ((reference: any, property: string, context?: DataCollection) => any),
    set?: ((reference: any, property: string, value: any, context?: DataCollection) => void),
    node?: vNode,
    handler?: EventHandler,
    update?: UpdateOptions
}
/**NOT IMPLEMENTED */
type UpdateOptions = {
    include?: string[],
    exclude?: string[],
    parameter?: string,
    propagate?: boolean
}
/**Set of data to define component's properties*/
type TemplateOptions = {
    dataset?: DataCollection,
    settings?: Settings,
    inputs?: string[],
    events?: iEvent<any>[],
    actions?: any,
    computed?: any,
}
/**Set of parameters for defining new component */
type ComponentOptions = {
    selector: string,
    template?: string,
    templatePath?: string,
    styles?: string[],
    stylesPath?: string,
    options?: TemplateOptions,
    class?: iComponent
};
//#endregion

type DataCollection = {
    [key: string]: any
}

/**For stamp data with specified format */
type Formatter = {
    stamp: (value: any) => any,
    type: any
}

type Theme = {
    name: "brand" | "primary" | "secondary" | "tertiary",
    color: string
}

type ViewSettings = {
    darkmode: boolean,
    radius?: string,
    animation?: string,
    palette?: Theme[],
    font?: string,
    size?: string
}

type QueryElement = {
    attribute?: string,
    class?: string,
    nodeName?: string
}

export { Settings, StringAction, ApplicationBuilder, iComponent } //classes
export type { iPrototype, iEvent, iCommand, iTemplate } //interfaces
export type { Formatter, ReactivityOptions, CommandOptions, TemplateOptions, UpdateOptions, DataCollection, QueryElement, ComponentOptions } //types