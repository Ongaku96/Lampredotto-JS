import "./global.js";
import { Collection } from "./enumerators.js";
import { Support } from "./library.js";
import log from "./console.js";
class ApplicationBuilder {
    application;
    get app() { return this.application; }
    constructor(application) {
        this.application = application;
    }
    async build(options) {
        try {
            this.application.build(options).then(() => {
                this.application.elaborate();
            });
            return this.app;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        finally {
            return this.app;
        }
    }
    async update(options) {
        try {
            this.application.build(options).then(() => {
                this.application.update();
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        finally {
            return this.app;
        }
    }
    async dismiss() {
        this.application.dismiss();
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
    }
}
export { Settings, StringAction, ApplicationBuilder }; //classes
