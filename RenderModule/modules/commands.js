import { vNode } from "./virtualizer.js";
import { Support } from "./library.js";
import { elaborateContent, renderBrackets } from "./reactive.js";
import { Collection } from "./enumerators.js";
import log from "./console.js";
import EventHandler from "./events.js";
class Command {
    _attribute;
    _handler = new EventHandler();
    get handler() { return this._handler; }
    get attribute() { return this._attribute; }
    constructor(attribute) {
        this._attribute = attribute;
    }
    render(node) {
        throw new Error("Method not implemented. " + node.id);
    }
    accept(options) {
        throw new Error("Method not implemented. " + options.nodename);
    }
}
class CommandVisitor {
    node;
    constructor(node) {
        this.node = node;
    }
    /**Setup Model Command */
    visitModel(command) {
        let _me = this;
        let _input = ["INPUT", "TEXTAREA", "SELECT"];
        try {
            this.setupEvents(command);
            if (this.node.reference.length && _input.includes(this.node.nodeName)) {
                this.node.reference[0].addEventListener("input", function () {
                    command.updateDataSet(_me.node);
                });
            }
            command.accept({
                attribute: "",
                modifiers: [],
                value: command.attribute?.value,
                nodename: this.node.nodeName
            });
            if (command.attribute && this.node.reference[0].nodeType == Node.ELEMENT_NODE)
                this.node.reference[0].removeAttribute(command.attribute.name);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup On Command */
    visitOn(command) {
        try {
            this.setupEvents(command);
            let _formatted_attribute = command.attribute?.name.includes(cOn.key) ? command.attribute.name : command.attribute?.name.replace("@", cOn.key + ":");
            command.accept({
                attribute: this.readAttribute(_formatted_attribute),
                modifiers: this.readModifiers(_formatted_attribute),
                value: command.attribute?.value,
                nodename: this.node.nodeName
            });
            if (command.attribute?.name && this.node.reference[0].nodeType == Node.ELEMENT_NODE)
                this.node.reference[0].removeAttribute(command.attribute?.name);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup For Command */
    visitFor(command) {
        try {
            this.setupEvents(command);
            let _template = this.node.backup.cloneNode(true);
            _template.removeAttribute(cFor.key);
            _template.removeAttribute(cFor.filter_key);
            _template.removeAttribute(cFor.sort_key);
            let _options = {
                attribute: "",
                modifiers: [],
                nodename: this.node.nodeName,
                value: command.attribute?.value,
                others: {
                    filter: this.node.element?.getAttribute(cFor.filter_key),
                    sort: this.node.element?.getAttribute(cFor.sort_key),
                    template: _template.outerHTML
                }
            };
            command.accept(_options);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup Bind Command */
    visitBind(command) {
        try {
            this.setupEvents(command);
            let _formatted_attribute = command.attribute?.name.includes(cBind.key) ? command.attribute?.name : command.attribute?.name.replace(":", cBind.key + ":");
            command.accept({
                attribute: this.readAttribute(_formatted_attribute),
                modifiers: [],
                value: command.attribute?.value,
                nodename: this.node.nodeName
            });
            if (command.attribute?.name && this.node.reference[0].nodeType == Node.ELEMENT_NODE)
                this.node.reference[0].removeAttribute(command.attribute?.name);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup Conditional Rendering Command */
    visitIf(command) {
        try {
            this.setupEvents(command);
            command.accept({
                attribute: "",
                modifiers: [],
                value: null,
                nodename: this.node.nodeName,
                others: elab(this.node.element, this.node.reference[0])
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        /**Elaborate conditional view set of instructions, it needs the original node backup for if in case of template (because of node replacement)
         * and the actual node reference for checking sibling  */
        function elab(node, reference) {
            let _block = [];
            let _conditional = getConditionalBlock(node);
            if (_conditional)
                _block.push(_conditional);
            let _sibling = reference?.nextElementSibling;
            while (_sibling != null && !(_sibling.getAttributeNames().includes(cIf.key))) {
                let _conditional = getConditionalBlock(_sibling);
                if (_conditional)
                    _block.push(_conditional);
                _sibling = goAhead(_sibling, _conditional != null);
            }
            return _block;
            /**Get Conditional View set based on attribute conditions */
            function getConditionalBlock(sibling) {
                if (sibling) {
                    //Check IF
                    if (sibling.getAttributeNames().includes(cIf.key)) {
                        let _condition = function (context) {
                            let _condition = sibling.getAttribute(cIf.key);
                            if (_condition) {
                                let _elab = elaborateContent(_condition, context);
                                return checkValue(_elab);
                            }
                            return false;
                        };
                        let _template = sibling.cloneNode(true);
                        _template.removeAttribute(cIf.key);
                        return {
                            template: _template,
                            condition: _condition,
                            active: false
                        };
                    }
                    //Check ELSEIF
                    if (sibling.getAttributeNames().includes(cIf.key_elseif)) {
                        let _condition = function (context) {
                            let _condition = sibling.getAttribute(cIf.key_elseif);
                            if (_condition) {
                                let _elab = elaborateContent(_condition, context);
                                return checkValue(_elab);
                            }
                            return false;
                        };
                        let _template = sibling.cloneNode(true);
                        _template.removeAttribute(cIf.key_elseif);
                        return {
                            template: _template,
                            condition: _condition,
                            active: false
                        };
                    }
                    //Check ELSE
                    if (sibling.getAttributeNames().includes(cIf.key_else)) {
                        let _template = sibling.cloneNode(true);
                        _template.removeAttribute(cIf.key_else);
                        return {
                            template: _template,
                            condition: function () { return true; },
                            active: false
                        };
                    }
                }
                return null;
                function checkValue(value) {
                    if (typeof value == "boolean")
                        return value;
                    else
                        return value != null;
                }
            }
            /**Get next sibling and remove previous if was a part of conditional block */
            function goAhead(sibling, remove) {
                if (sibling != null) {
                    let _temp = sibling.nextElementSibling;
                    if (remove)
                        sibling.remove();
                    return _temp;
                }
                return null;
            }
        }
    }
    setupEvents(command) {
        command.handler.on(Collection.node_event.setup, async (output) => {
            if (Support.debug(this.node.settings, Collection.debug_mode.command))
                log({ command: this.node.id + " - " + command.constructor.name.toUpperCase(), event: "SETUP", node: this, data: output }, Collection.message_type.debug);
        });
        command.handler.on(Collection.node_event.render, async (output) => {
            if (Support.debug(this.node.settings, Collection.debug_mode.command))
                log({ command: this.node.id + " - " + command.constructor.name.toUpperCase(), event: "RENDER", node: this, data: output }, Collection.message_type.debug);
        });
    }
    readAttribute(param) {
        let _on = param ? param?.split(":") : [];
        if (_on.length > 0) {
            return _on[1].split(".")[0];
        }
        return "";
    }
    readModifiers(param) {
        let _on = param ? param.split(":") : [];
        if (_on.length > 0) {
            return _on[1].split(".")?.subarray(1);
        }
        return [];
    }
}
class cModel extends Command {
    static key = "cmd-model";
    static regexp = /(CMD-MODEL)|(cmd-model)/gm;
    /**Type of element that contains model command*/
    node_type;
    /**Content of model */
    reference;
    /**type of data model (array, number, string, ecc..) */
    stored_data_type = "";
    constructor(attribute) {
        super(attribute);
    }
    render(node) {
        try {
            if (node.reference.length && this.reference && node.element) {
                let _value = node.reference[0].value;
                let _new_value = Support.getValue(node.context, this.reference);
                let _debug = null;
                switch (this.node_type) {
                    case "INPUT":
                    case "TEXTAREA":
                        let _type = node.element?.getAttribute("type");
                        switch (_type) {
                            case "checkbox":
                            case "radio":
                                let _checked = _value != null && _value != "on" ?
                                    (Array.isArray(_new_value) ? _new_value.includes(_value) : _value == _new_value) :
                                    _new_value;
                                _debug = _checked;
                                node.reference[0].checked = _debug;
                                break;
                            case "date":
                                try {
                                    _debug = Support.getValue(node.context, this.reference);
                                    var date = _debug instanceof Date ? _debug : new Date(_debug);
                                    node.reference[0].value =
                                        date.getFullYear() + "-" +
                                            ("00" + (date.getMonth() + 1).toString()).padRight(2) + "-" +
                                            ("00" + date.getDate()).padRight(2);
                                }
                                catch (ex) {
                                    log("error converting '" + _debug + "' to datetime: " + ex, Collection.message_type.error);
                                }
                                break;
                            default:
                                _debug = this.readValue(node.context, node.settings);
                                node.reference[0].value = _debug;
                                break;
                        }
                        break;
                    case "SELECT":
                        if (Array.isArray(_new_value)) {
                            _debug = [];
                            for (let option of Array.from(node.reference[0].options)) {
                                option.selected = _new_value.includes(option.value) || _new_value.includes(option.text);
                                if (option.selected)
                                    _debug.push(option.value);
                            }
                        }
                        else {
                            if (node.state === Collection.lifecycle.mounting) {
                                node.onProgress((state) => {
                                    _debug = this.reference ? Support.getValue(node.context, this.reference) : _new_value;
                                    switch (state) {
                                        case Collection.lifecycle.ready:
                                            node.reference[0].value = _debug;
                                            break;
                                    }
                                });
                            }
                        }
                        break;
                    default:
                        _debug = this.readValue(node.context, node.settings);
                        if (_debug && typeof (_debug) === "string") {
                            let temp = Support.templateFromString(_debug);
                            let _child = temp.firstChild;
                            if (_child) {
                                node.removeChildren();
                                do {
                                    node.append(_child.cloneNode(true));
                                    _child = _child.nextSibling;
                                } while (_child != null);
                            }
                        }
                        else {
                            if (node.reference.length)
                                node.reference[0].nodeValue = _debug;
                        }
                        break;
                }
                this._handler.trigger(Collection.node_event.render, { type: node.element?.getAttribute("type"), value: _debug });
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options) {
        this.reference = options.value;
        this.node_type = options.nodename;
        this._handler.trigger(Collection.node_event.setup, options);
    }
    readValue(context, settings) {
        try {
            return this.reference ? Support.format(Support.getValue(context, this.reference), settings?.formatters) : "";
        }
        catch (ex) {
            throw ex;
        }
    }
    updateDataSet(input) {
        try {
            if (this.reference) {
                let _element = input.reference[0];
                let _value = Support.getValue(input.context, this.reference);
                let _new_value = _element.value;
                let _input_type = _element.getAttribute("type");
                switch (input.nodeName) {
                    case "SELECT":
                        if (Array.isArray(_value)) {
                            if (_value.includes(_new_value)) {
                                Support.setValue(input.context, this.reference, _value.filter(e => e != _new_value));
                            }
                            else {
                                Support.setValue(input.context, this.reference, _value.push(_new_value));
                            }
                        }
                        else {
                            Support.setValue(input.context, this.reference, _new_value);
                        }
                        break;
                    default:
                        switch (_input_type) {
                            case "checkbox":
                            case "radio":
                                if (_new_value == "on")
                                    _new_value = "";
                                if (_new_value) {
                                    if (Array.isArray(_value)) {
                                        if (_input_type == "radio")
                                            Support.setValue(input.context, this.reference, []);
                                        if (_value.includes(_new_value)) {
                                            Support.setValue(input.context, this.reference, _value.filter(e => e != _new_value));
                                        }
                                        else {
                                            Support.setValue(input.context, this.reference, _value.push(_new_value));
                                        }
                                    }
                                    else {
                                        Support.setValue(input.context, this.reference, _element.checked ? _new_value : "");
                                    }
                                }
                                else {
                                    Support.setValue(input.context, this.reference, _element.checked);
                                }
                                break;
                            case "textbox":
                            case "text":
                                Support.setValue(input.context, this.reference, _new_value ? _new_value.escapeHTML() : _new_value);
                                break;
                            case "date":
                            case "datetime-local":
                                Support.setValue(input.context, this.reference, _new_value ? new Date(_new_value) : _new_value);
                                break;
                            case "number":
                                Support.setValue(input.context, this.reference, _new_value ? Number(_new_value) : _new_value);
                                break;
                            default:
                                if (_new_value) {
                                    let _val = Number(_new_value);
                                    if (!Number.isNaN(_val))
                                        _new_value = _val;
                                }
                                Support.setValue(input.context, this.reference, _new_value);
                                break;
                        }
                        break;
                }
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    clone(attribute) {
        return new cModel(attribute);
    }
}
class cFor extends Command {
    static key = "cmd-for";
    static filter_key = "cmd-filter";
    static sort_key = "cmd-sort";
    static regexp = /(CMD-FOR)|(cmd-for)/gm;
    /**separator key in command attribute */
    separator = " in ";
    /**Index reference used inside the template */
    static index = ":index";
    /**template to repeat */
    template = "";
    /**alias of data used inside the template */
    alias = "";
    /**reference to node's array into data context */
    reference = "";
    _filter = "";
    _sort = "";
    _desc = false;
    _backup = [];
    constructor(attribute) {
        super(attribute);
    }
    render(node) {
        try {
            let _me = this;
            let _data = this.sort(Support.getValue(node.context, this.reference), node); //getting data
            if (_data != null) {
                _data = _data.filter((e) => {
                    let index = () => {
                        let i = 0;
                        for (const item of _data) {
                            if (JSON.stringify(item) === JSON.stringify(e))
                                return i;
                            i++;
                        }
                        return -1;
                    };
                    return this.filter(node.context, index());
                });
                if (_data && Array.isArray(_data)) {
                    node.placeFlag((node) => {
                        oldRenderingMethod();
                        // newRenderingMethod();
                        this._handler.trigger(Collection.node_event.render, { data: _data, stamp: node.incubator });
                        return this._backup.length > 0;
                        function oldRenderingMethod() {
                            node.incubator.textContent = ""; //reset node incubator
                            for (let i = 0; i < _data.length; i++) {
                                //Duplicate parent context for iteration
                                let _context = Support.cloneCollection(node.context);
                                //build and prepare html template code
                                let _template = elaborateTemplate(i);
                                //Initialize virtual node tree of template
                                let _new_node = setupNewNode(_template, _data[i], _context); //render template content
                                for (const render of _new_node.reference) {
                                    node.incubator.appendChild(render);
                                }
                            }
                            node.replaceNodes(); //replace current reference with elaborated value
                        }
                        // function newRenderingMethod() {
                        //     for (let i = 0; i < _data.length; i++) {
                        //         let _rendered = _me._backup.find(e => e.context[_me.alias] == _data[i]);
                        //         //filter item based on filter settings
                        //         if (_me.filter(node.context, i)) {
                        //             if (_rendered) {
                        //                 _rendered.update();
                        //             } else {
                        //                 //Duplicate parent context for iteration
                        //                 let _context = Support.cloneCollection(node.context);
                        //                 //build and prepare html template code
                        //                 let _template = elaborateTemplate(i);
                        //                 //Initialize virtual node tree of template
                        //                 let _new_node = setupNewNode(_template, _data[i], _context); //render template content
                        //                 //inject the result in node's incubator
                        //                 if (i > 0) {
                        //                     let _before = _me._backup[i - 1];
                        //                     if (_before) {
                        //                         let _reference = _before.reference[_before.reference.length - 1];
                        //                         if (_reference) {
                        //                             for (const render of _new_node.reference) {
                        //                                 (<Element>_reference).after(render);
                        //                             }
                        //                         }
                        //                     } else {
                        //                         log("Unable to find previous element in array " + _me.reference, Collection.message_type.warning);
                        //                     }
                        //                 } else {
                        //                     for (const element of node.reference) {
                        //                         (<HTMLElement>element).remove();
                        //                     }
                        //                     for (const render of _new_node.reference) {
                        //                         node.flag.after(render);
                        //                     }
                        //                 }
                        //                 _me._backup?.push(_new_node);
                        //             }
                        //         } else {
                        //             if (_rendered) {
                        //                 _me._backup = _me._backup.filter(e => e !== _rendered);
                        //                 for (const el of _rendered.reference) {
                        //                     (<Element>el).remove();
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }
                        function setupNewNode(_template, item, _context) {
                            let _new_node = vNode.newInstance(_template, node.parent);
                            _context[_me.alias] = item;
                            _new_node.setup();
                            _new_node.elaborate(_context); //render template content
                            return _new_node;
                            //PROBLEMS WITH PROXY ON ITEM: 
                            //  Cannot difference data[i] form eventual array children, 
                            //  Target in get refer to himself so it will go in loop. So I needed to refer to data[i] but in case of annidate for, the child array will never be seen. 
                            //setup internal reactivity rules with passive dynamic update of parent data 
                            // let _reactive: ReactivityOptions = {
                            //     get: (_target: any, _key: any) => {
                            //         if (typeof _data[_key] == "function") return Reflect.get(_data, _key).bind(_data);
                            //         if (_key && typeof _data[i] == "object" && _key in _data[i]) return Reflect.get(_data[i], _key);
                            //         return Reflect.get(_data, i);
                            //     },
                            //     set: (_target: any, _key: any, newvalue: any) => {
                            //         if (_target === _data[i])
                            //             Support.setValue(_data[i], _key, newvalue); else _data[i] = newvalue;
                            //         _new_node.update();
                            //     }
                            // };
                            //inject current array value into internal context
                            // if (Support.isPrimitive(_data[i])) {
                            //     ref(_context, _me.alias, _data[i], _reactive);
                            // } else {
                            //     _context[_me.alias] = react(_data[i], _reactive);
                            // }
                        }
                        function elaborateTemplate(index) {
                            //replace index references
                            let _html = _me.template.replace(new RegExp(cFor.index, "g"), index.toString());
                            //convert html string code to Document Fragment
                            let _template = Support.templateFromString(_html)?.firstChild;
                            return _template;
                        }
                    });
                }
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options) {
        this._backup = [];
        this.template = options.others?.template;
        this._filter = options.others?.filter;
        this._desc = options.others?.sort?.toLowerCase().includes("desc");
        this._sort = options.others?.sort?.replace(/desc/i, "").trim();
        let _content = options.value.split(this.separator);
        if (_content.length == 2) {
            this.alias = _content[0];
            this.reference = _content[1];
        }
        this._handler.trigger(Collection.node_event.setup, options);
    }
    sort(data, node) {
        try {
            if (data && this._sort) {
                let _param = this._sort;
                if (!(_param in data[0])) {
                    _param = renderBrackets(this._sort, node.context, node.settings);
                    this._desc = _param.includes("desc");
                    _param = _param.replace(/desc/g, "").trim();
                }
                if (_param) {
                    _param = _param
                        .replace(new RegExp(this.alias + "\.|\$\." + this.alias + "\.|" + this.alias + "|\$\." + this.alias, "g"), "")
                        .trim();
                    return data.sort(Support.dynamicSort(_param, this._desc));
                }
            }
            return data;
        }
        catch (ex) {
            throw ex;
        }
    }
    filter(context, index) {
        try {
            if (this._filter && index >= 0) {
                let _function = "return " + this._filter
                    .replace(new RegExp(cFor.index, "g"), index.toString())
                    .replace(new RegExp(this.alias + "|" + ("\$\." + this.alias), "g"), `$.${this.reference}[${index}]`);
                return Support.runFunctionByString(_function, context);
            }
            return true;
        }
        catch (ex) {
            throw ex;
        }
    }
    clone(attribute) {
        return new cFor(attribute);
    }
}
class cOn extends Command {
    static key = "cmd-on";
    static regexp = /(CMD-ON:[a-zA-Z-]+)|(cmd-on:[a-zA-Z-]+)|(\@[a-zA-Z-]+)/gm;
    setted = false;
    event = {
        name: "", action: async () => { }
    };
    constructor(attribute) {
        super(attribute);
    }
    render(node) {
        try {
            let _me = this;
            if (!this.setted && node.reference.length) {
                if (Support.isNativeEvent(this.event.name)) {
                    node.reference[0].addEventListener(this.event.name, function (evt) {
                        return _me.event.action(evt, node.context);
                    });
                }
                else {
                    node.on(this.event.name, (evt) => {
                        this.event.action(evt, node.context);
                    });
                }
                _me._handler.trigger(Collection.node_event.render, _me.event.name);
                this.setted = true;
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options) {
        this.event = {
            name: options.attribute,
            action: function (evt, context) { return elaborateContent(options.value, context, evt); }
        };
        this._handler.trigger(Collection.node_event.setup, options);
    }
    clone(attribute) {
        return new cOn(attribute);
    }
}
class cIf extends Command {
    static key = "cmd-if";
    static key_elseif = "cmd-elseif";
    static key_else = "cmd-else";
    static regexp = /(CMD-IF)|(cmd-if)/gm;
    active_node;
    conditions = [];
    constructor(attribute) {
        super(attribute);
    }
    render(node) {
        try {
            node.incubator.textContent = ""; //reset node incubator
            let _replaced = false;
            let i = 0;
            while (i < this.conditions.length) {
                if (this.conditions[i].condition(node.context)) {
                    let _template = this.conditions[i].template?.cloneNode(true);
                    if (_template && !this.conditions[i].active) {
                        this.active_node = virtualizeTemplate(_template);
                        //inject the result in node's incubator
                        buildIncubator(this.active_node);
                        _replaced = true;
                        this._handler.trigger(Collection.node_event.render, {
                            condition: this.conditions[i].condition.toString(),
                            original: this.conditions[i].template,
                            stamp: this.active_node
                        });
                    }
                    this.activeCondition(i);
                    break;
                }
                else {
                    if (this.conditions[i].active) {
                        _replaced = true;
                        this.conditions[i].active = false;
                        this.active_node = undefined;
                    }
                }
                i++;
            }
            if (_replaced || this.conditions.find((c) => c.active) == null) {
                //replace current reference with elaborated value
                node.replaceNodes();
            }
            else {
                if (this.active_node)
                    this.active_node.update();
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
        function buildIncubator(_vnode) {
            for (const render of _vnode.reference) {
                node.incubator.appendChild(render);
            }
        }
        function virtualizeTemplate(_template) {
            let _vnode = vNode.newInstance(_template, node.parent);
            _vnode.setup();
            _vnode.elaborate();
            return _vnode;
        }
    }
    accept(options) {
        this.conditions = options.others;
        this._handler.trigger(Collection.node_event.setup, options);
    }
    clone(attribute) {
        return new cIf(attribute);
    }
    activeCondition(index) {
        let i = 0;
        while (i < this.conditions.length) {
            this.conditions[i].active = i == index;
            i++;
        }
    }
}
class cBind extends Command {
    static key = "cmd-bind";
    static regexp = /(CMD-BIND:[a-zA-Z-]+)|(cmd-bind:[a-zA-Z-]+)|(:[a-zA-Z-]+)/gm;
    attribute_bind = "";
    reference = "";
    constructor(attribute) {
        super(attribute);
    }
    render(node) {
        try {
            if (node.reference.length && node.reference[0].nodeType == Node.ELEMENT_NODE && this.reference && this.attribute_bind) {
                let _value = elaborateContent(this.reference, node.context);
                if (typeof _value == 'boolean' || _value == null) {
                    if (_value)
                        node.reference[0].setAttribute(this.attribute_bind, "");
                    else
                        node.reference[0].removeAttribute(this.attribute_bind);
                }
                else {
                    node.reference[0].setAttribute(this.attribute_bind, _value);
                }
                this._handler.trigger(Collection.node_event.render, {
                    attribute: this.attribute_bind,
                    stamp: _value
                });
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options) {
        this.reference = options.value;
        this.attribute_bind = options.attribute;
        this._handler.trigger(Collection.node_event.setup, options);
    }
    clone(attribute) {
        return new cBind(attribute);
    }
}
export { CommandVisitor };
export { cModel, cFor, cOn, cIf, cBind };
