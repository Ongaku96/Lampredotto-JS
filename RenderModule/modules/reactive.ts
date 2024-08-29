import { Support } from "./library.js";
import { Collection } from "./enumerators.js";
import { ReactivityOptions, Settings } from "./types.js";
import { Application } from "./application.js";
import { vNode } from "./virtualizer.js";

export const _vault_key = "__vault";
export const _proxy_key = "__proxy";
/**Keep simple variables reactive to changes in order to trigger interface update */
export function ref(target: any, key: string, value: any = null, options?: ReactivityOptions): void {
    if (target[_vault_key] == null) target[_vault_key] = {};
    Support.setValue(target[_vault_key], key, value);
    const reactiveProperty: PropertyDescriptor & ThisType<any> = {
        get() {
            if (options && options.get != null)
                return options?.get(target, key);

            else
                return trigger(target[_vault_key], key, options);
        },
        set(newvalue) {
            if (target[key] != newvalue) {
                if (options && options.set != null)
                    options?.set(target, key, newvalue);

                else
                    track(target[_vault_key], key, newvalue, options);
            }
            return true;
        },
        configurable: true,
    };
    Object.defineProperty(target, key, reactiveProperty);
}
/**Keep objects reactive to change in order to trigger interface update */
export function react(obj: any, options?: ReactivityOptions): ProxyConstructor {
    if (Support.isPrimitive(obj) || typeof obj == "function" || obj == null) return obj;
    if (!Reflect.get(obj, _proxy_key)) {
        return new Proxy(obj, {
            get(target: any, key: string) {
                if (key !== _proxy_key) {
                    if (valueIsNotReactive(target[key])) return react(target[key], options); //if value is an object it return another handlered object
                    if (options && options.get != null) { return options.get(target, key, options?.node?.context); } //return value with the handler options instructions
                    else { return trigger(target, key, options); } //return value by defaut mode
                }
                return true;
            },
            set(target: any, key: string, value: any) {
                if (options && options.set != null)
                    options.set(target, key, value);
                else
                    track(target, key, value, options);
                return true;
            },
        });
    }
    return obj
}
/**Default method to process value */
function trigger(target: any, key: string, _options?: ReactivityOptions): any {
    try {
        return typeof Reflect.get(target, key) === 'function' ?
            Reflect.get(target, key).bind(Array.isArray(target) ? react(target, _options) : target) :
            Reflect.get(target, key);
    } catch (ex) {
        throw ex;
    }
}
/**Default method tu set value, it trigger an update event on passed handler by options */
function track(target: any, key: string, value: any, options?: ReactivityOptions): void {
    if (Reflect.get(target, key) != value) {
        Reflect.set(target, key, value);
        options?.handler?.trigger(Collection.application_event.update, options.update);
    }
}
/**Keeep an array reactive to changes in order to update interface on event. Every single iteration became reactive */
export function ArrayProxy(array: any[], options?: ReactivityOptions): any[] {
    let _result: any[] = [];
    array.forEach((item) => { _result.push(Array.isArray(item) ? ArrayProxy(item) : react(item, options)); });
    return _result;
}
/**Return value of expression or property from app's dataset. Refer to app with $.*/
export function renderBrackets(content: string, context: any, settings?: Settings, event?: Event, references?: { key: string, value: any }[]) {
    let _bracket = "";
    try {
        return content.replace(Collection.regexp.brackets, (match) => {
            _bracket = match;
            let _content = match.escapeBrackets();
            try {
                let _elab = elaborateContent(_content, context, event, references);
                if (_elab != null) {
                    let _stamp = Support.format(_elab, settings?.formatters);
                    return _stamp != null ? _stamp : "";
                }
            } catch (ex) {
                //console.warn(getErrorMessage(Collection.errors.notfound, "EX8", "<renderBrackets: " + _content + "> " + ex.message));
            }
            return "";
        });
    } catch (ex) {
        throw "error compiling code in brackets " + _bracket + ": " + ex;
    }
}
/**Elaborate dynamic content from application data */
export function elaborateContent(content: string, context: any, event?: Event, references?: { key: string, value: any }[], _return: boolean = true, ...args: any[]) {
    try {
        //Replace all references in content
        if (references) {
            for (const ref of references) {
                content = content.replace(new RegExp("(?:" + ref.key + "(?:.[a-zA-Z_$]+[w$]*)*)", "g"),
                    (substring: string) => {
                        let _path = substring.replace(ref.key + ".", "");
                        let _value = _path == substring ? ref.value : Support.getValue(ref.value, _path);
                        // if (app && app.format) _value = app.format(_value);
                        return typeof (_value) == "number" ? _value.toString() : "'" + _value + "'";
                    }
                );
            }
        }
        //Find value in context
        let _val = Support.getValue(context, content);
        //If there were no value in context try to run content as a script
        if ((_val == null || _val == undefined) && !(content in context)) _val = Support.runFunctionByString(content, context, event, _return);
        //If value is a function try to run it
        if (typeof (_val) == "function") return _val.call(context, ...args, event);
        //Return the formatted value as indicated by app settings
        return _val;
    } catch (ex) {
        throw "error compiling content {" + content + "}: " + ex;
    }
}
/**Replace all array references with app path */
export function cleanScriptReferences(script: string, param: string, prefix: string, index: number) {
    while (script.includes(prefix)) {
        script = script.replace(prefix, "$." + param + "[" + index + "]");
    }
    return script;
}
/**Returns context A if it exists, otherwise returns context B */
export function readContext(contextA: object | undefined, contextB: object | undefined) {
    return !Support.isEmpty(contextA) ? contextA : contextB ? contextB : {};
}
/**Execute a javascript function by name */
export function runFunctionByName(script: string, evt: Event, context: Application) {
    try {
        var _script = script
            .replace(/'/g, '"')
            .replace(/\n/g, "\\n")
            .replace(Collection.regexp.appdata, (match) => {
                let _formatted_match = match.slice(1);
                return `context.dataset${_formatted_match}`;
            });
        let _function = new Function("evt", "context", _script);
        return _function(evt, context);
    } catch (ex) {
        throw ex;
    }
}
/**Check if value has another level of accessibility */
export function valueIsNotReactive(value: any): boolean {
    return value != null && //value exists
        typeof value == "object" && //value is an Object
        !value[_proxy_key] && //value is not a proxy Object
        !(value instanceof vNode); //value is not a virtualized Node Object
}