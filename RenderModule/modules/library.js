import { Collection } from "./enumerators.js";
import { primitive_types } from "./global.js";
import { _vault_key, react } from "./reactive.js";
export var Support;
(function (Support) {
    /**Execute a stringified function */
    function runFunctionByString(script, context, evt, _return = true) {
        try {
            var _script = cleanScript();
            let _function = new Function("evt", _script);
            return _function.call(context, evt);
        }
        catch (ex) {
            throw "error executing script {" + script + "}: " + ex;
        }
        function cleanScript() {
            var _script = script
                .replace(/'/g, '"')
                .replace(/\n/g, "\\n")
                .replace(Collection.regexp.appdata, (match) => {
                let _formatted_match = match.slice(1);
                return `this${_formatted_match}`;
            });
            if (!_script.match(/(this.)|\(|\)|\[|\]/g) && !_script.trim().startsWith("\"") && !_script.trim().endsWith("\""))
                _script = "\"" + _script + "\"";
            if (!_script.includes("return") && _return)
                _script = "return " + _script;
            return _script;
        }
    }
    Support.runFunctionByString = runFunctionByString;
    /**Get list of app's dataset properties that are included in the script */
    function getPropertiesFromScript(script) {
        let _props = [];
        let _match;
        if (script.includes("$.")) {
            while ((_match = Collection.regexp.appdata.exec(script)) !== null) {
                _props.push(_match[0].replace("$.", ""));
            }
        }
        else {
            _props.push(script);
        }
        return _props;
    }
    Support.getPropertiesFromScript = getPropertiesFromScript;
    /**
     * Function to sort alphabetically an array of objects by some specific key.
     *
     * @param {String}; property Key of the object to sort.
     */
    function dynamicSort(property, desc) {
        try {
            return function (a, b) {
                let _first = property ? getValue(a, property) : a;
                let _second = property ? getValue(b, property) : b;
                if (isNaN(_first)) {
                    if (desc) {
                        return _second.localeCompare(_first);
                    }
                    else {
                        return _first.localeCompare(_second);
                    }
                }
                else {
                    if (desc) {
                        return _second - _first;
                    }
                    else {
                        return _first - _second;
                    }
                }
            };
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.dynamicSort = dynamicSort;
    /**Deep copy of array values copied by value and not by ref*/
    function duplicateArray(array) {
        try {
            return JSON.parse(JSON.stringify(array));
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.duplicateArray = duplicateArray;
    /**merge multiple array in one */
    function mergeArrays(...arrays) {
        try {
            let _result = [];
            for (const array of arrays) {
                if (array) {
                    for (const item of array) {
                        if (!_result.includes(item)) {
                            _result.push(item);
                        }
                    }
                }
            }
            return _result;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.mergeArrays = mergeArrays;
    /**get unique ID */
    function uniqueID() {
        return Math.floor(Math.random() * Date.now()).toString(36);
    }
    Support.uniqueID = uniqueID;
    /**Elaborate tag and return object path stored inside */
    function getPathFromTag(tag, prefix = "") {
        try {
            if (prefix)
                tag = tag.replace(prefix + ".", "");
            return tag.replace("{{", "").replace("}}", "").trim();
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.getPathFromTag = getPathFromTag;
    /**Check if two objects has the same keys */
    function compareKeys(obj1, obj2) {
        try {
            let _a = Object.keys(obj1).sort();
            let _b = Object.keys(obj2).sort();
            return JSON.stringify(_a) === JSON.stringify(_b);
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.compareKeys = compareKeys;
    /**Check if value is that datatype  */
    function checkDataType(value, type) { return typeof value == type; }
    Support.checkDataType = checkDataType;
    /**check if value is not object or array or a function */
    function isPrimitive(value) { return primitive_types.includes(typeof value); }
    Support.isPrimitive = isPrimitive;
    /**Check if object is undefined or has properties */
    function isEmpty(obj) { return obj == null || Object.getOwnPropertyNames(obj).length === 0; }
    Support.isEmpty = isEmpty;
    /**Get value of object by a given string path of properties */
    function getValue(prop, path) {
        try {
            if (path && typeof path == "string") {
                let _array_path = path.replace(/\]/g, "").split(/[.\[]+/g);
                for (var i = 0; i < _array_path.length; i++) {
                    if (prop != null && !isPrimitive(prop) && _array_path[i] in prop) {
                        prop = prop[_array_path[i]];
                    }
                    else {
                        return i > 0 ? "" : undefined;
                    }
                }
                return prop;
            }
            return prop[path];
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.getValue = getValue;
    /**Set value of object by a given string path of properties */
    function setValue(prop, path, value) {
        try {
            if (path) {
                let _array_path = path.replace(/\]/g, "").split(/[.\[]+/g);
                for (var i = 0; i < _array_path.length; i++) {
                    if (prop) {
                        if (value !== undefined && i == _array_path.length - 1) {
                            prop[_array_path[i]] = value;
                        }
                        else {
                            prop = prop[_array_path[i]];
                        }
                    }
                }
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.setValue = setValue;
    /**Stamp value based on passed format*/
    function format(value, formatters) {
        try {
            if (formatters) {
                let _formatter = formatters?.find(f => typeof f.type == "string" ? f.type === typeof value : value instanceof f.type);
                return _formatter ? _formatter.stamp(value) : value;
            }
            return value;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.format = format;
    /**Convert string to HTML content inside a Document Fragment*/
    function templateFromString(template_text) {
        try {
            template_text = template_text.trim();
            let _template = document.createElement("template");
            _template.innerHTML = template_text;
            let _inner_template = _template.querySelector("template");
            if (_inner_template) {
                _template.innerHTML = _inner_template.innerHTML;
            }
            return _template.content;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.templateFromString = templateFromString;
    /**Build render reactive data context joining all data sets, actions and computed parameters */
    async function elaborateContext(context, dataset, reactivity, actions, computed) {
        //Define values from dataset
        if (dataset) {
            for (let param of Object.keys(dataset)) {
                try {
                    context[param] = react(dataset[param], reactivity);
                }
                catch (ex) {
                    throw ex;
                }
            }
        }
        //define values from actions
        if (actions) {
            for (let action of Object.keys(actions)) {
                context[action] = function (...args) { return actions[action].call(react(context, reactivity), ...args); };
            }
        }
        //define values from getters
        if (computed) {
            for (let getter of Object.keys(computed)) {
                Object.defineProperty(context, getter, {
                    get() {
                        return computed[getter].call(react(context, reactivity));
                    }
                });
            }
        }
        return context;
    }
    Support.elaborateContext = elaborateContext;
    /**Check if debug mode is active */
    function debug(settings, mode) {
        return settings.debug && (settings.debug_mode ? (mode ? (settings.debug_mode == Collection.debug_mode.all || settings.debug_mode == mode) : true) : true);
    }
    Support.debug = debug;
    /**Clone Data Collection */
    function cloneCollection(context) {
        try {
            let _data = {};
            for (const key of Reflect.ownKeys(context)) {
                if (key != _vault_key) {
                    // get: (_target: any, _key: any) => {
                    //     if (_key && !isPrimitive(Reflect.get(context, key))) return Reflect.get(context, key)[_key];
                    //     return Reflect.get(context, key);
                    // },
                    let _react = {
                        set: (_target, _key, newvalue) => {
                            if (newvalue != Reflect.get(context, key))
                                Reflect.set(context, key, newvalue);
                        }
                    };
                    // if (Support.isPrimitive(Reflect.get(context, key))) {
                    //     ref(context, key.toString(), _react);
                    // } else {
                    Reflect.set(_data, key, react(Reflect.get(context, key), _react));
                    // }
                }
            }
            return _data;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.cloneCollection = cloneCollection;
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof RegExp)
            return new RegExp(obj);
        if (obj instanceof Map)
            return new Map([...obj].map(([k, v]) => [deepClone(k), deepClone(v)]));
        if (obj instanceof Set)
            return new Set([...obj].map(v => deepClone(v)));
        // Handle Date
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        // Handle Array
        if (Array.isArray(obj)) {
            return obj.map(item => deepClone(item));
        }
        // Handle Object
        const clone = Object.create(Object.getPrototypeOf(obj));
        for (const key of Reflect.ownKeys(obj)) {
            clone[key] = deepClone(obj[key]);
        }
        return clone;
    }
    Support.deepClone = deepClone;
    /**Check if a value is an Array */
    function isArray(value) {
        return typeof value == 'function' && Array.isArray(value());
    }
    Support.isArray = isArray;
    /**Get all comments from root dom element */
    function getComment(content) {
        // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
        var iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT, filterNone);
        var curNode;
        while (curNode = iterator.nextNode()) {
            if (curNode.nodeValue === content)
                return curNode;
        }
        return null;
        function filterNone() {
            return NodeFilter.FILTER_ACCEPT;
        }
    }
    Support.getComment = getComment;
    /**Check if event is native */
    function isNativeEvent(eventname) {
        return typeof Reflect.get(document.body, "on" + eventname) !== "undefined";
    }
    Support.isNativeEvent = isNativeEvent;
    function checkQuery(element, query) {
        if (typeof query == "string") {
            return element.closest(query) === element;
        }
        return query.attribute ? (element.hasAttribute(query.attribute) && (query.value ? element.getAttribute(query.attribute) == query.value : true)) : false ||
            element.nodeName.toUpperCase() == query.nodeName?.toUpperCase() ||
            query.class ? element.className.includes(query.class || "") : false;
    }
    Support.checkQuery = checkQuery;
    function decodeHtml(input) {
        return input
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, "&");
    }
    Support.decodeHtml = decodeHtml;
    function registerColor(name, hex, alpha = 1) {
        const hsl = hexToHsl(hex);
        const root = document.documentElement;
        root.style.setProperty(`--${name}-h`, hsl.h);
        root.style.setProperty(`--${name}-s`, hsl.s);
        root.style.setProperty(`--${name}-l`, hsl.l);
        root.style.setProperty(`--${name}-a`, String(alpha));
        // optional convenience vars for plain CSS fallback
        root.style.setProperty(`--${name}`, hex);
        if (!["brand", "primary", "secondary", "tertiary", "neutral", "info", "success", "warning", "danger", "light", "dark"].includes(name)) {
            const css = `[relevance="${name}"]{ background-color: var(--${name}); color: var(--${name}-on, #DDDCDB); }`;
            const style = document.getElementById("dynamic-palette") ?? generateStyleElement("dynamic-palette");
            if (style.sheet != null) {
                style.sheet.insertRule(css, style.sheet.cssRules.length);
            }
            function generateStyleElement(id) {
                const s = document.createElement("style");
                s.id = id;
                document.head.appendChild(s);
                return s;
            }
        }
        function hexToHsl(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                var r = parseInt(result[1], 16) / 255;
                var g = parseInt(result[2], 16) / 255;
                var b = parseInt(result[3], 16) / 255;
                var max = Math.max(r, g, b), min = Math.min(r, g, b);
                var h = 0, s = 0, l = (max + min) / 2;
                if (max !== min) {
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
                return { s: Math.round(s * 100) + "%", l: Math.round(l * 100) + "%", h: Math.round(360 * h) + "deg" };
            }
            return { s: "0%", l: "0%", h: "0deg" };
        }
    }
    Support.registerColor = registerColor;
})(Support || (Support = {}));
export var View;
(function (View) {
    function darkmode() {
        if (document.body.getAttribute("theme")) {
            document.body.setAttribute("theme", "");
        }
        else {
            document.body.setAttribute("theme", "dark");
        }
    }
    View.darkmode = darkmode;
})(View || (View = {}));
