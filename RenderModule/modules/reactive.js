import { Support } from "./library.js";
import { Collection } from "./enumerators.js";
import log from "./console.js";
export const _vault_key = "__vault";
export function ref(target, key, value = null, options) {
    if (target[_vault_key] == null)
        target[_vault_key] = {};
    Support.setValue(target[_vault_key], key, value);
    Object.defineProperty(target, key, {
        get() {
            if (options && options.get != null)
                return options?.get(target, key);
            else
                return trigger(target, _vault_key + "." + key, options);
        },
        set(newvalue) {
            if (target[key] != newvalue) {
                if (options && options.set != null)
                    options?.set(target, key, newvalue);
                else
                    track(target, _vault_key + "." + key, newvalue, options);
            }
            return true;
        }
    });
}
export function react(obj, options) {
    return new Proxy(obj, {
        get(target, key) {
            if (typeof target[key] == "object")
                return react(target[key], options);
            if (options && options.get != null)
                return options.get(target, key, options?.node?.context);
            else
                return trigger(target, key, options);
        },
        set(target, key, value) {
            if (options && options.set != null)
                options.set(target, key, value);
            else
                track(target, key, value, options);
            return true;
        },
    });
}
function trigger(target, key, _options) {
    try {
        return Support.getValue(target, key);
    }
    catch (ex) {
        throw ex;
    }
}
function track(target, key, value, options) {
    if (Support.getValue(target, key) != value) {
        Support.setValue(target, key, value);
        options?.handler?.trigger(Collection.application_event.update, options.update);
    }
}
export function ArrayProxy(array, options) {
    let _result = [];
    for (let item of array) {
        let _temp = {};
        if (Support.isPrimitive(item)) {
            ref(_temp, "value", item, options);
            _result.push(_temp);
        }
        else {
            if (Array.isArray(item)) {
                _result.push(ArrayProxy(item));
            }
            else {
                _result.push(react(item, options));
            }
        }
    }
    return _result;
}
/**Return value of expression or property from app's dataset. Refer to app with $.*/
export function renderBrackets(content, context, settings, event, references) {
    try {
        return content.replace(Collection.regexp.brackets, (match) => {
            let _content = match.escapeBrackets();
            try {
                let _elab = elaborateContent(_content, context, event, references);
                if (_elab != null) {
                    let _stamp = Support.format(_elab, settings?.formatters);
                    return _stamp != null ? _stamp : "";
                }
            }
            catch (ex) {
                //console.warn(getErrorMessage(Collection.errors.notfound, "EX8", "<renderBrackets: " + _content + "> " + ex.message));
            }
            return "";
        });
    }
    catch (ex) {
        throw ex;
    }
}
/**Elaborate dynamic content from application data */
export function elaborateContent(content, context, event, references, _return = true) {
    try {
        //Replace all references in content
        if (references) {
            for (const ref of references) {
                content = content.replace(new RegExp("(?:" + ref.key + "(?:.[a-zA-Z_$]+[w$]*)*)", "g"), (substring) => {
                    let _path = substring.replace(ref.key + ".", "");
                    let _value = _path == substring ? ref.value : Support.getValue(ref.value, _path);
                    // if (app && app.format) _value = app.format(_value);
                    return typeof (_value) == "number" ? _value.toString() : "'" + _value + "'";
                });
            }
        }
        //Find value in context
        let _val = Support.getValue(context, content);
        //If there were no value in context try to run content as a script
        if ((_val == null || _val == undefined) && !(content in context))
            _val = Support.runFunctionByString(content, context, event, _return);
        //If value is a function try to run it
        if (typeof (_val) == "function")
            return _val.call(context, event);
        //Return the formatted value as indicated by app settings
        return _val;
    }
    catch (ex) {
        log(ex, Collection.message_type.error);
        return null;
    }
}
/**Replace all array references with app path */
export function cleanScriptReferences(script, param, prefix, index) {
    while (script.includes(prefix)) {
        script = script.replace(prefix, "$." + param + "[" + index + "]");
    }
    return script;
}
/**Returns context A if it exists, otherwise returns context B */
export function readContext(contextA, contextB) {
    return !Support.isEmpty(contextA) ? contextA : contextB ? contextB : {};
}
/**Execute a javascript function by name */
export function runFunctionByName(script, evt, context) {
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
    }
    catch (ex) {
        throw ex;
    }
}
