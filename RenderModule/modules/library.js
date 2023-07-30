import { Collection } from "./enumerators.js";
import { primitive_types } from "./global.js";
import { react, ref } from "./reactive.js";
export var Support;
(function (Support) {
    /**Execute a stringified function */
    function runFunctionByString(script, context, evt, _return = true) {
        try {
            var _script = script
                .replace(/'/g, '"')
                .replace(/\n/g, "\\n")
                .replace(Collection.regexp.appdata, (match) => {
                let _formatted_match = match.slice(1);
                return `this${_formatted_match}`;
            });
            if (!_script.includes("this") && !_script.trim().startsWith("\"") && !_script.trim().endsWith("\""))
                _script = "\"" + _script + "\"";
            if (!_script.includes("return") && _return)
                _script = "return " + _script;
            let _function = new Function("evt", _script);
            return _function.call(context, evt);
        }
        catch (ex) {
            throw ex;
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
                // let _parent = "__parent" in prop ? prop.__parent : null;
                let _array_path = path.replace(/\]/g, "").split(/[.\[]+/g);
                for (var i = 0; i < _array_path.length; i++) {
                    if (prop != null && _array_path[i] in prop) {
                        prop = prop[_array_path[i]];
                    }
                    else {
                        return null;
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
                let _formatter = formatters?.find(f => f.type === typeof value);
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
            return _template.content;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.templateFromString = templateFromString;
    /**Build render reactive data context joining all data sets, actions and computed parameters */
    async function elaborateContext(dataset, reactivity, actions, computed) {
        let _context = {};
        //Define values from dataset
        if (dataset) {
            for (let param of Object.keys(dataset)) {
                try {
                    if (Support.isPrimitive(Support.getValue(dataset, param))) {
                        ref(_context, param, Support.getValue(dataset, param), reactivity);
                    }
                    else {
                        _context[param] = react(dataset[param], reactivity);
                        // if (Array.isArray(dataset[param])) {
                        //     ArrayProxy(dataset[param], reactivity);
                        // } else {
                        //     _context[param] = react(dataset[param], reactivity);
                        // }
                    }
                }
                catch (ex) {
                    throw ex;
                }
            }
        }
        //define values from actions
        if (actions) {
            for (let action of Object.keys(actions)) {
                _context[action] = function (...args) { return actions[action].call(_context, ...args); };
            }
        }
        //define values from getters
        if (computed) {
            for (let getter of Object.keys(computed)) {
                Object.defineProperty(_context, getter, {
                    get() {
                        return computed[getter].call(_context);
                    }
                });
            }
        }
        return _context;
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
            for (const key of Object.keys(context)) {
                if (typeof context[key] == "function") {
                    _data[key] = context[key];
                }
                else {
                    if (Array.isArray(context[key])) {
                        _data[key] = duplicateArray(context[key]);
                    }
                    else {
                        _data[key] = structuredClone(context[key]);
                    }
                }
            }
            return _data;
        }
        catch (ex) {
            throw ex;
        }
    }
    Support.cloneCollection = cloneCollection;
    /**Check if a value is an Array */
    function isArray(value) {
        return typeof value == 'function' && Array.isArray(value());
    }
    Support.isArray = isArray;
    /**Get parent context if it exists instead of current context */
    // export function getParentContext(node: vNode): DataCollection {
    //     return key_parent in node.context ? node.context[key_parent] : node.context;
    // }
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
