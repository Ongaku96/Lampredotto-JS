import { vNode } from "./virtualizer.js";
import { Support } from "./library.js";
import { CommandOptions, DataCollection, iCommand, iEvent, Settings } from "./types.js";
import { elaborateContent, renderBrackets } from "./reactive.js";
import { Collection } from "./enumerators.js";
import log from "./console.js";
import EventHandler from "./events.js";

/**
 * check if element is content editable
 * @date 29/3/2024 - 10:54:43
 *
 * @param {HTMLElement} element
 * @returns {*}
 */
function isContentEditable(element: HTMLElement) {
    let _attr = element.getAttribute("contenteditable");
    return _attr != null && _attr == "true";
}
/**
 * Command's Interface
 * @date 27/3/2024 - 11:42:08
 *
 * @abstract
 * @class Command
 * @typedef {Command}
 * @implements {iCommand}
 */
abstract class Command implements iCommand {

    protected _attribute: Attr | undefined;
    protected _handler: EventHandler = new EventHandler();
    get handler() { return this._handler; }
    get attribute() { return this._attribute; }

    constructor(attribute?: Attr | undefined) {
        this._attribute = attribute;
    }

    render(node: vNode): void {
        throw new Error("Method not implemented. " + node.id);
    }
    accept(options: CommandOptions): void {
        throw new Error("Method not implemented. " + options.nodename);
    }

    abstract clone(_attribute: Attr): Command
}

/**
 * Visitor template for Commands implementation
 * @date 27/3/2024 - 11:41:39
 *
 * @class CommandVisitor
 * @typedef {CommandVisitor}
 */
class CommandVisitor {
    private node: vNode;

    constructor(node: vNode) {
        this.node = node;
    }

    /**Setup Model Command */
    visitModel(command: cModel) {
        let _me = this;
        let _input = ["INPUT", "TEXTAREA", "SELECT"];
        try {
            this.setupEvents(command);
            if (this.node.reference.length && (_input.includes(this.node.nodeName) || isContentEditable(<HTMLElement>this.node.reference[0]))) {
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
            if (command.attribute && this.node.reference[0].nodeType == Node.ELEMENT_NODE) (<HTMLElement>this.node.reference[0]).removeAttribute(command.attribute.name);
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup On Command */
    visitOn(command: cOn) {
        try {
            this.setupEvents(command);
            let _formatted_attribute = command.attribute?.name.includes(cOn.key) ? command.attribute.name : command.attribute?.name.replace("@", cOn.key + ":");
            command.accept({
                attribute: this.readAttribute(_formatted_attribute),
                modifiers: this.readModifiers(_formatted_attribute),
                value: command.attribute?.value,
                nodename: this.node.nodeName
            });
            if (command.attribute?.name && this.node.reference[0].nodeType == Node.ELEMENT_NODE) (<HTMLElement>this.node.reference[0]).removeAttribute(command.attribute?.name);
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup For Command */
    visitFor(command: cFor) {
        try {
            this.setupEvents(command);

            let _template = <HTMLElement>this.node.backup.cloneNode(true);

            _template.removeAttribute(cFor.key);
            _template.removeAttribute(cFor.filter_key);

            let _sort = _template.getAttributeNames()?.find(a => a.includes(cFor.sort_key));
            if (_sort) _template.removeAttribute(_sort);
            let _desc = this.readAttribute(_sort);
            let _sort_value = _sort ? this.node.element?.getAttribute(_sort) : null;

            let _options = {
                attribute: "",
                modifiers: [],
                nodename: this.node.nodeName,
                value: command.attribute?.value,
                others: {
                    filter: this.node.element?.getAttribute(cFor.filter_key),
                    sort: _sort_value?.replace(/desc/i, "").trim(),
                    desc: _desc && _desc == "desc" || _sort_value?.includes("desc") ? true : false,
                    template: _template.outerHTML
                }
            }
            command.accept(_options);

        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup Bind Command */
    visitBind(command: cBind) {
        try {
            this.setupEvents(command);
            let _formatted_attribute = command.attribute?.name.includes(cBind.key) ? command.attribute?.name : command.attribute?.name.replace(":", cBind.key + ":");
            command.accept({
                attribute: this.readAttribute(_formatted_attribute),
                modifiers: [],
                value: command.attribute?.value,
                nodename: this.node.nodeName
            });
            if (command.attribute?.name && this.node.reference[0].nodeType == Node.ELEMENT_NODE) (<HTMLElement>this.node.reference[0]).removeAttribute(command.attribute?.name);
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Setup Conditional Rendering Command */
    visitIf(command: cIf) {
        try {
            this.setupEvents(command);
            command.accept({
                attribute: "",
                modifiers: [],
                value: null,
                nodename: this.node.nodeName,
                others: elab(this.node.element, <Element>this.node.reference[0])
            });
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
        /**Elaborate conditional view set of instructions, it needs the original node backup for if in case of template (because of node replacement) 
         * and the actual node reference for checking sibling  */
        function elab(node: Element | null, reference: Element | null): { template: Node | undefined, condition: (context?: DataCollection) => boolean, active: boolean }[] {

            let _block: { template: Node | undefined, condition: (context?: DataCollection) => boolean, active: boolean }[] = [];

            let _conditional = getConditionalBlock(node);
            if (_conditional) _block.push(_conditional);

            let _sibling = reference?.nextElementSibling;


            while (_sibling != null && !(_sibling.getAttributeNames().includes(cIf.key))) {
                let _conditional = getConditionalBlock(_sibling);
                if (_conditional) _block.push(_conditional);
                _sibling = goAhead(_sibling, _conditional != null);
            }

            return _block;

            /**Get Conditional View set based on attribute conditions */
            function getConditionalBlock(sibling: Element | null): { template: Node | undefined, condition: (context?: DataCollection) => boolean, active: boolean } | null {
                if (sibling) {
                    //Check IF
                    if (sibling.getAttributeNames().includes(cIf.key)) {
                        let _condition = function (context?: DataCollection) {
                            let _condition = sibling.getAttribute(cIf.key);
                            if (_condition) {
                                let _elab = elaborateContent(_condition, context);
                                return checkValue(_elab);
                            }
                            return false;
                        }
                        let _template = sibling.cloneNode(true);
                        (<HTMLElement>_template).removeAttribute(cIf.key);

                        return {
                            template: _template,
                            condition: _condition,
                            active: false
                        }
                    }
                    //Check ELSEIF
                    if (sibling.getAttributeNames().includes(cIf.key_elseif)) {
                        let _condition = function (context?: DataCollection) {
                            let _condition = sibling.getAttribute(cIf.key_elseif);
                            if (_condition) {
                                let _elab = elaborateContent(_condition, context);
                                return checkValue(_elab);
                            }
                            return false;
                        }
                        let _template = sibling.cloneNode(true);
                        (<HTMLElement>_template).removeAttribute(cIf.key_elseif);

                        return {
                            template: _template,
                            condition: _condition,
                            active: false
                        }
                    }
                    //Check ELSE
                    if (sibling.getAttributeNames().includes(cIf.key_else)) {
                        let _template = sibling.cloneNode(true);
                        (<HTMLElement>_template).removeAttribute(cIf.key_else);

                        return {
                            template: _template,
                            condition: function () { return true; },
                            active: false
                        }
                    }
                }
                return null;

                function checkValue(value: any): boolean {
                    if (typeof value == "boolean") return value; else return value != null;
                }
            }
            /**Get next sibling and remove previous if was a part of conditional block */
            function goAhead(sibling: Element | null, remove: boolean): Element | null {
                if (sibling != null) {
                    let _temp = sibling.nextElementSibling;
                    if (remove) sibling.remove();
                    return _temp;
                }
                return null;
            }

        }

    }

    private setupEvents(command: Command) {
        command.handler.on(Collection.node_event.setup,
            async (output) => {
                if (Support.debug(this.node.settings, Collection.debug_mode.command))
                    log({ command: this.node.id + " - " + command.constructor.name.toUpperCase(), event: "SETUP", node: this, data: output }, Collection.message_type.debug);
            });
        command.handler.on(Collection.node_event.render,
            async (output) => {
                if (Support.debug(this.node.settings, Collection.debug_mode.command))
                    log({ command: this.node.id + " - " + command.constructor.name.toUpperCase(), event: "RENDER", node: this, data: output }, Collection.message_type.debug);
            });
    }

    private readAttribute(param: string | undefined): string {
        let _on = param ? param?.split(":") : [];
        if (_on.length > 1) {
            return _on[1].split(".")[0];
        }
        return "";
    }

    private readModifiers(param: string | undefined): string[] {
        let _on = param ? param.split(":") : [];
        if (_on.length > 1) {
            return _on[1].split(".")?.subarray(1);
        }
        return [];
    }

}

/**
 * Command for data binding on Element content or input Value
 * @date 27/3/2024 - 11:38:04
 *
 * @class cModel
 * @typedef {cModel}
 * @extends {Command}
 */
class cModel extends Command {

    static key: Readonly<string> = "cmd-model";
    static regexp: RegExp = /(CMD-MODEL)|(cmd-model)/gm;

    /**Type of element that contains model command*/
    private node_type: string | undefined;
    /**Content of model */
    private reference: string | null | undefined;
    /**type of data model (array, number, string, ecc..) */
    public stored_data_type: Readonly<string> = "";

    constructor(attribute?: Attr | undefined) {
        super(attribute);
    }

    render(node: vNode) {
        try {
            if (node.reference.length && this.reference && node.element) {
                let _value = (<HTMLInputElement>node.reference[0]).value;
                let _new_value = Support.getValue(node.context, this.reference);

                let _debug: any = null;

                switch (this.node_type) {
                    case "INPUT":
                    case "TEXTAREA":
                        let _type = node.element?.getAttribute("type");
                        switch (_type) {
                            case "checkbox":
                            case "radio":
                                let _checked =
                                    _value != null && _value != "on" ?
                                        (Array.isArray(_new_value) ? _new_value.includes(_value) : _value == _new_value) :
                                        _new_value;

                                _debug = _checked;
                                (<HTMLInputElement>node.reference[0]).checked = _debug;
                                break;
                            case "date":
                                try {
                                    _debug = Support.getValue(node.context, this.reference);
                                    var date: Date = _debug instanceof Date ? _debug : new Date(_debug);
                                    (<HTMLInputElement>node.reference[0]).value =
                                        date.getFullYear() + "-" +
                                        ("00" + (date.getMonth() + 1).toString()).padRight(2) + "-" +
                                        ("00" + date.getDate()).padRight(2);
                                } catch (ex) {
                                    log("error converting '" + _debug + "' to datetime: " + ex, Collection.message_type.error);
                                }
                                break;
                            default:
                                _debug = this.readValue(node.context, node.settings);
                                (<HTMLInputElement>node.reference[0]).value = _debug;
                                break;
                        }
                        break;
                    case "SELECT":
                        if (Array.isArray(_new_value)) {
                            _debug = [];
                            for (let option of Array.from((<HTMLSelectElement>node.reference[0]).options)) {
                                option.selected = _new_value.includes(option.value) || _new_value.includes(option.text);
                                if (option.selected) _debug.push(option.value);
                            }
                        } else {
                            if (node.state === Collection.lifecycle.mounting) {
                                node.onProgress((state) => {
                                    _debug = this.reference ? Support.getValue(node.context, this.reference) : _new_value;
                                    switch (state) {
                                        case Collection.lifecycle.ready:
                                            (<HTMLSelectElement>node.reference[0]).value = _debug;
                                            break;
                                    }
                                });
                            }
                        }
                        break;
                    default:
                        _debug = this.readValue(node.context, node.settings);
                        if (_debug && typeof (_debug) === "string" && !isContentEditable(<HTMLElement>node.reference[0])) {
                            let temp = Support.templateFromString(_debug);
                            let _child = temp.firstChild;
                            if (_child) {
                                node.removeChildren();
                                do {
                                    node.append(_child.cloneNode(true));
                                    _child = _child.nextSibling;
                                } while (_child != null);
                            }

                        } else {
                            if (node.reference.length && (<HTMLElement>node.reference[0]).innerText != _debug)
                                if (isContentEditable(<HTMLElement>node.reference[0]))
                                    (<HTMLElement>node.reference[0]).innerText = _debug;
                                else
                                    (<HTMLElement>node.reference[0]).nodeValue = _debug;
                        }
                        break;
                }
                this._handler.trigger(Collection.node_event.render, { type: node.element?.getAttribute("type"), value: _debug });
            }
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }

    accept(options: CommandOptions) {
        this.reference = options.value;
        this.node_type = options.nodename;
        this._handler.trigger(Collection.node_event.setup, options);
    }

    private readValue(context: any, settings?: Settings): string {
        try {
            return this.reference ? Support.format(Support.getValue(context, this.reference), settings?.formatters) : "";
        } catch (ex) {
            throw ex;
        }
    }

    public updateDataSet(input: vNode) {
        try {
            if (this.reference) {
                let _element = input.reference[0];
                let _value = Support.getValue(input.context, this.reference);
                let _new_value: any = !(_element instanceof HTMLInputElement) && isContentEditable(<HTMLElement>_element) ? (<HTMLElement>_element).innerText : (<HTMLInputElement>_element).value;
                let _input_type = (<HTMLElement>_element).getAttribute("type");
                switch (input.nodeName) {
                    case "SELECT":
                        if (Array.isArray(_value)) {
                            if (_value.includes(_new_value)) {
                                Support.setValue(input.context, this.reference, _value.filter(e => e != _new_value));
                            } else {
                                Support.setValue(input.context, this.reference, _value.push(_new_value));
                            }
                        } else {
                            Support.setValue(input.context, this.reference, _new_value);
                        }
                        break;
                    default:
                        switch (_input_type) {
                            case "checkbox":
                            case "radio":
                                if (_new_value == "on") _new_value = "";
                                if (_new_value) {
                                    if (Array.isArray(_value)) {
                                        if (_input_type == "radio") Support.setValue(input.context, this.reference, []);
                                        if (_value.includes(_new_value)) {
                                            Support.setValue(input.context, this.reference, _value.filter(e => e != _new_value));
                                        } else {
                                            Support.setValue(input.context, this.reference, _value.push(_new_value));
                                        }
                                    } else {
                                        Support.setValue(input.context, this.reference, (<HTMLInputElement>_element).checked ? _new_value : "");
                                    }
                                } else {
                                    Support.setValue(input.context, this.reference, (<HTMLInputElement>_element).checked);
                                }
                                break;
                            case "textbox": case "text":
                                Support.setValue(input.context, this.reference, _new_value ? _new_value.escapeHTML() : _new_value);
                                break;
                            case "date": case "datetime-local":
                                Support.setValue(input.context, this.reference, _new_value ? new Date(_new_value) : _new_value);
                                break;
                            case "number":
                                Support.setValue(input.context, this.reference, _new_value ? Number(_new_value) : _new_value);
                                break;
                            default:
                                if (_new_value) {
                                    let _val = Number(_new_value);
                                    if (!Number.isNaN(_val)) _new_value = _val;
                                }
                                Support.setValue(input.context, this.reference, _new_value);
                                break;
                        }
                        break;
                }
            }
        } catch (ex) {
            throw ex;
        }
    }

    clone(attribute: Attr): Command {
        return new cModel(attribute);
    }
}

/**
 * Command for iterate array and duplicate Element for each iteration.
 * It apply independent rendering management. 
 * @date 27/3/2024 - 11:38:39
 *
 * @class cFor
 * @typedef {cFor}
 * @extends {Command}
 */
class cFor extends Command {

    static key: Readonly<string> = "cmd-for";
    static filter_key: Readonly<string> = "cmd-filter";
    static sort_key: Readonly<string> = "cmd-sort";
    static regexp: RegExp = /(CMD-FOR)|(cmd-for)/gm;
    /**separator key in command attribute */
    private separator: Readonly<string> = " in ";
    /**Index reference used inside the template */
    private static index: Readonly<string> = ":index";
    /**template to repeat */
    private template: string = "";
    /**alias of data used inside the template */
    private alias: string = "";
    /**reference to node's array into data context */
    private reference: string = "";

    private _filter: string = "";
    private _sort: string = "";
    private _desc: boolean = false;

    private _backup: vNode[] = [];

    constructor(attribute?: Attr | undefined) {
        super(attribute);
    }

    render(node: vNode) {
        try {
            let _me = this;
            let _data = Support.getValue(node.context, this.reference); //getting data
            if (_data != null) {
                _data = _data.filter((e: any) => {
                    let index = () => {
                        let i = 0;
                        for (const item of _data) {
                            if (JSON.stringify(item) === JSON.stringify(e)) return i;
                            i++;
                        }
                        return -1;
                    }
                    return this.filter(node.context, index());
                });
                _data = this.sort(_data, node);
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
                        function setupNewNode(_template: ChildNode | null, item: any, _context: DataCollection) {
                            let _new_node = vNode.newInstance(<Node>_template, node.parent);
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
                        function elaborateTemplate(index: number) {
                            //replace index references
                            let _html = _me.template.replace(new RegExp(cFor.index, "g"), index.toString());
                            //convert html string code to Document Fragment
                            let _template = Support.templateFromString(_html)?.firstChild;
                            return _template;
                        }
                    });
                }
            }
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }

    accept(options: CommandOptions) {
        this._backup = [];
        this.template = options.others?.template;
        this._filter = options.others?.filter;
        this._desc = options.others?.desc;
        this._sort = options.others?.sort;

        let _content = options.value.split(this.separator);
        if (_content.length == 2) {
            this.alias = _content[0];
            this.reference = _content[1];
        }
        this._handler.trigger(Collection.node_event.setup, options);
    }

    sort(data: any[], node: vNode): any[] {
        try {
            if (data && this._sort && data.length) {
                let _param = this._sort;
                if (!(_param in data[0])) {
                    _param = renderBrackets(this._sort, node.context, node.settings);
                    if (!this._desc) this._desc = _param.includes("desc");
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
        } catch (ex) {
            throw ex;
        }
    }

    filter(context: DataCollection, index: number): boolean {
        try {
            if (this._filter && index >= 0) {
                let _function =
                    "return " + this._filter
                        .replace(new RegExp(cFor.index, "g"), index.toString())
                        .replace(new RegExp(this.alias + "|" + ("\$\." + this.alias), "g"), `$.${this.reference}[${index}]`);
                return Support.runFunctionByString(_function, context);
            }
            return true;
        } catch (ex) {
            throw ex;
        }
    }

    clone(attribute: Attr): Command {
        return new cFor(attribute);
    }
}

/**
 * Command for synchronizing events on element with the application
 * @date 27/3/2024 - 11:39:54
 *
 * @class cOn
 * @typedef {cOn}
 * @extends {Command}
 */
class cOn extends Command {

    static key: Readonly<string> = "cmd-on";
    static regexp: RegExp = /(CMD-ON:[a-zA-Z-]+)|(cmd-on:[a-zA-Z-]+)|(\@[a-zA-Z-]+)/gm;

    private setted: boolean = false;
    private event: iEvent<any> = {
        name: "", action: async () => { }
    };

    constructor(attribute?: Attr | undefined) {
        super(attribute);
    }

    render(node: vNode) {
        try {
            let _me = this;
            if (!this.setted && node.reference.length) {
                if (Support.isNativeEvent(this.event.name)) {
                    node.reference[0].addEventListener(this.event.name, function (evt) {
                        return _me.event.action(evt, node.context);
                    });
                } else {
                    node.on(this.event.name, (evt) => {
                        this.event.action(evt, node.context);
                    });
                }
                _me._handler.trigger(Collection.node_event.render, _me.event.name);
                this.setted = true;
            }
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options: CommandOptions) {
        this.event = {
            name: options.attribute,
            action: function (evt: Event, context: any) { return elaborateContent(options.value, context, evt); }
        };
        this._handler.trigger(Collection.node_event.setup, options);
    }

    clone(attribute: Attr): Command {
        return new cOn(attribute);
    }
}

/**
 * Command for conditional rendering
 * @date 27/3/2024 - 11:40:43
 *
 * @class cIf
 * @typedef {cIf}
 * @extends {Command}
 */
class cIf extends Command {
    static key: Readonly<string> = "cmd-if";
    static key_elseif: Readonly<string> = "cmd-elseif";
    static key_else: Readonly<string> = "cmd-else";
    static regexp: RegExp = /(CMD-IF)|(cmd-if)/gm;

    private active_node: vNode | undefined;
    private conditions: { template: Node | undefined, condition: (context?: DataCollection) => boolean, active: boolean }[] = [];

    constructor(attribute?: Attr | undefined) {
        super(attribute);
    }

    render(node: vNode) {
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
                } else {
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
            } else {
                if (this.active_node) this.active_node.update();
            }

        } catch (ex) {
            log(ex, Collection.message_type.error);
        }

        function buildIncubator(_vnode: vNode) {
            for (const render of _vnode.reference) {
                node.incubator.appendChild(render);
            }
        }

        function virtualizeTemplate(_template: Node) {
            let _vnode = vNode.newInstance(_template, node.parent);
            _vnode.setup();
            _vnode.elaborate();
            return _vnode;
        }
    }
    accept(options: CommandOptions) {
        this.conditions = options.others;
        this._handler.trigger(Collection.node_event.setup, options);
    }
    clone(attribute: Attr): Command {
        return new cIf(attribute);
    }

    private activeCondition(index: number) {
        let i = 0;
        while (i < this.conditions.length) {
            this.conditions[i].active = i == index;
            i++;
        }
    }
}

/**
 * Command for binding Element's attributes value
 * @date 27/3/2024 - 11:41:00
 *
 * @class cBind
 * @typedef {cBind}
 * @extends {Command}
 */
class cBind extends Command {
    static key: Readonly<string> = "cmd-bind";
    static regexp: RegExp = /(CMD-BIND:[a-zA-Z-]+)|(cmd-bind:[a-zA-Z-]+)|(:[a-zA-Z-]+)/gm;

    private attribute_bind: string = "";
    private reference: string = "";

    constructor(attribute?: Attr | undefined) {
        super(attribute);
    }
    render(node: vNode) {
        try {
            if (node.reference.length && node.reference[0].nodeType == Node.ELEMENT_NODE && this.reference && this.attribute_bind) {
                let _value = elaborateContent(this.reference, node.context);
                if (typeof _value == 'boolean' || _value == null) {
                    if (_value) (<HTMLElement>node.reference[0]).setAttribute(this.attribute_bind, ""); else (<HTMLElement>node.reference[0]).removeAttribute(this.attribute_bind);
                } else {
                    (<HTMLElement>node.reference[0]).setAttribute(this.attribute_bind, _value);
                }

                this._handler.trigger(Collection.node_event.render, {
                    attribute: this.attribute_bind,
                    stamp: _value
                });
            }
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    accept(options: CommandOptions) {
        this.reference = options.value;
        this.attribute_bind = options.attribute;
        this._handler.trigger(Collection.node_event.setup, options);
    }

    clone(attribute: Attr): Command {
        return new cBind(attribute);
    }
}

export { CommandVisitor };
export { cModel, cFor, cOn, cIf, cBind, type Command };

