import { Support } from "./library.js";
import { Collection, command_matches } from "./enumerators.js";
import { CommandVisitor, cBind, cFor, cIf, cModel, cOn } from "./commands.js";
import { elaborateContent, ref, renderBrackets } from "./reactive.js";
import EventHandler from "./events.js";
import log from "./console.js";
export class vNode {
    /**Return new instance of virtual node */
    static newInstance(reference, settings) {
        let _component = globalThis.my_components?.find(c => c.name.toUpperCase() == reference.nodeName.toUpperCase());
        return _component != null ? new vTemplate(reference, _component.template, _component.options) : new vNode(reference, settings);
    }
    //#region PUBLIC
    /**virtual node identifier */
    id;
    /**original html node element */
    backup;
    /**Get if node element have dynamic elements or not */
    static;
    /**Data context of node */
    context = {};
    /**Settings of node */
    settings;
    //#endregion
    //#region PRIVATE
    _handler = new EventHandler(); //events utility management
    _incubator = document.createDocumentFragment(); //node's space for rendering elaboration
    _reference = []; //node reference
    _commands = []; //list of framework commands stored in virtual Node
    _command_visitor = new CommandVisitor(this); //commands Visitor for interaction
    _state = Collection.lifecycle.initialized; //private node state store
    _children = []; //virtual children
    _flag; //flag comment in html for elaboration reference
    //#endregion
    set state(value) {
        this._state = value;
        this._handler.trigger(Collection.node_event.progress, Collection.lifecycle[this.state]);
    }
    /**State of node's elaboration */
    get state() { return this._state; }
    /**Original element in case node is HTML Element */
    get element() { return this.backup.nodeType == Node.ELEMENT_NODE ? this.backup : null; }
    /**Node's children */
    get children() { return this._children; }
    /**Reference for elaboration space */
    get incubator() { return this._incubator; }
    /**Reference container */
    get reference() { return this._reference; }
    /**Type of node */
    get nodeType() { return this.backup.nodeType; }
    /**Node name */
    get nodeName() { return this.backup.nodeName; }
    constructor(original, settings) {
        this.id = Support.uniqueID();
        this.state = Collection.lifecycle.creating;
        this.backup = original.cloneNode(true);
        this.settings = settings ? settings : { debug: true, debug_mode: Collection.debug_mode.all };
        this.static = false;
        this._flag = document.createComment("#NODE " + this.id);
        this.create(original);
    }
    create(original) {
        try {
            if (original.nodeType == Node.ELEMENT_NODE) {
                this.checkCommands(original);
                if (!this._commands.find(c => c instanceof cIf || c instanceof cFor))
                    this.mapChildren(original);
            }
            this.static = this.checkIfStatic();
            original.virtual = this;
            this.reference.push(original);
            this.state = Collection.lifecycle.created;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**First elaboration of html node */
    setup() {
        this.state = Collection.lifecycle.setup;
        try {
            if (!this.static) {
                this.incubator.appendChild(this.backup.cloneNode(false));
                for (let comm of this._commands) {
                    if (comm instanceof cModel)
                        this._command_visitor.visitModel(comm);
                    if (comm instanceof cOn)
                        this._command_visitor.visitOn(comm);
                    if (comm instanceof cBind)
                        this._command_visitor.visitBind(comm);
                    if (comm instanceof cIf)
                        this._command_visitor.visitIf(comm);
                    if (comm instanceof cFor)
                        this._command_visitor.visitFor(comm);
                }
            }
            if (!this._commands.find(c => c instanceof cFor)) {
                for (const child of this.children) {
                    child.setup();
                }
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    elaborate(parent_context, settings) {
        this.mergeSettings(settings);
        if (Support.debug(this.settings) && this.nodeType == Node.ELEMENT_NODE && this.reference[0]) {
            this.reference[0].setAttribute("data-id", this.id);
        }
        this.state = Collection.lifecycle.mounting;
        try {
            this.context = parent_context;
            this.update(false).then((node) => {
                node.state = Collection.lifecycle.mounted;
            });
            this.elaborateChildren(this);
            this.onInject(async (node) => { node.elaborate(node.context, node.settings); });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    elaborateChildren(node) {
        if (!node._commands.find(c => c instanceof cFor)) { //exclude for because of auto elaboration of command
            for (const child of node.children) {
                child.elaborate(node.context, node.settings);
            }
        }
    }
    async update(recoursive, options) {
        this.state = Collection.lifecycle.updating;
        try {
            if (this.isUpdatable(options)) {
                if (!this.static && this.reference.length) {
                    renderNode(this);
                }
                if (recoursive && !this._commands.find(c => c instanceof cFor)) {
                    for (const child of this.children) {
                        child.update(recoursive, options);
                    }
                }
                async function renderNode(node) {
                    switch (node.nodeType) {
                        case Node.ELEMENT_NODE:
                            let _for = node._commands.find(c => c instanceof cFor);
                            if (_for != null) {
                                _for.render(node);
                            }
                            else {
                                for (let comm of node._commands) {
                                    comm.render(node);
                                }
                            }
                            break;
                        case Node.TEXT_NODE:
                            if (node.backup.nodeValue) {
                                let _debug = renderBrackets(node.backup.nodeValue, node.context, node.settings);
                                node.reference[0].nodeValue = _debug;
                                if (Support.debug(node.settings, Collection.debug_mode.command))
                                    log({ command: node.id + " - TEXT", value: _debug, origin: node.backup.nodeValue }, Collection.message_type.debug);
                            }
                            break;
                    }
                }
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
        finally {
            this.state = Collection.lifecycle.updated;
            return this;
        }
    }
    //#region ELABORATION
    /**Conteol presence of commands attributes and store them in commands archive */
    checkCommands(element) {
        try {
            let _attributes = element.attributes; //get list of node attributes
            for (let attr of Array.from(_attributes)) {
                let _key = command_matches.find(k => attr.name.match(k.key)); //check if this attribute is command reference 
                if (_key) { //store command based on attribute
                    this._commands.push(_key.value.clone(attr));
                }
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    /**Store children nodes as virtual nodes */
    mapChildren(element) {
        try {
            let _children = element.childNodes;
            for (const child of Array.from(_children)) {
                let _node = vNode.newInstance(child, this.settings);
                if (checkChild(child))
                    this.children.push(_node);
            }
            /**Check if child contains conditional rendering commands */
            function checkChild(child) {
                if (child.nodeType == Node.ELEMENT_NODE)
                    return child.getAttributeNames().find(a => a == cIf.key_else || a == cIf.key_elseif) == null;
                return true;
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    /**Check if node has dynamic elements */
    checkIfStatic() {
        if (this.backup.nodeType == Node.ELEMENT_NODE) {
            return this._commands.length == 0 && !checkDynamicAttribute(this.element);
        }
        else {
            return this.backup.nodeValue?.match(Collection.regexp.brackets) == null;
        }
        function checkDynamicAttribute(element) {
            if (element && "attributes" in element) {
                for (let attr of Array.from(element.attributes)) {
                    if (attr.nodeValue?.match(Collection.regexp.brackets)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    /**Replace reference with incubator's content */
    replaceNodes() {
        try {
            if (this.reference.length) {
                this.reference[this.reference.length - 1].after(this._flag);
                for (let node of this.reference) {
                    node.remove();
                }
                this._reference = [];
                for (let newnode of Array.from(this.incubator.childNodes)) {
                    this._flag.before(newnode);
                    this.reference.push(newnode);
                }
                this._flag.remove();
                this._flag = document.createComment("#NODE " + this.id);
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    mergeSettings(settings) {
        if (settings.darkmode != null)
            this.settings.darkmode = settings.darkmode;
        if (settings.debug != null)
            this.settings.debug = settings.debug;
        if (settings.debug_mode != null)
            this.settings.debug_mode = settings.debug_mode;
        if (this.settings.formatters == null)
            this.settings.formatters = [];
        if (settings.formatters) {
            for (const formatter of settings.formatters) {
                if (!this.settings.formatters?.find(f => f.type == formatter.type))
                    this.settings.formatters?.push(formatter);
            }
        }
    }
    isUpdatable(options) {
        if (options) {
            let _inclused = checkInclusion(this);
            function checkInclusion(node) {
                if (options?.include) {
                    return options?.include.includes(node.id);
                }
                return true;
            }
            let _exclused = checkExclusion(this);
            function checkExclusion(node) {
                if (options?.exclude) {
                    return options?.exclude.includes(node.id);
                }
                return false;
            }
            let _parameter = true;
            let _propagate = options.propagate ? options.propagate : true;
            return _inclused && !_exclused && _parameter && _propagate;
        }
        return true;
    }
    //#endregion
    //#region EVENTS
    /**Define events on state's changes */
    onProgress(action) {
        this._handler.on(Collection.node_event.progress, action);
    }
    onInject(action) {
        this._handler.on(Collection.node_event.inject, action);
    }
    onDataset(action) {
        this._handler.on(Collection.node_event.dataset, action);
    }
    //#endregion
    //#region HTML INJECTION
    append(node) {
        this.incubator.appendChild(node);
        let _node = vNode.newInstance(node, this.settings);
        _node.setup();
        this._children.push(_node);
        this._handler.trigger(Collection.node_event.inject, _node);
    }
    prepend(node) {
        this.reference.prepend(node);
        let _node = vNode.newInstance(node, this.settings);
        _node.setup();
        this._children = this._children.prepend(_node);
        this._handler.trigger(Collection.node_event.inject, _node);
    }
}
/**virtual node for templates */
export class vTemplate extends vNode {
    template = "";
    vtemplate_children = [];
    attributes = [];
    content_tags = [];
    dataset = {};
    constructor(reference, template, options) {
        super(reference);
        this.createTemplate(reference, template, options);
    }
    createTemplate(original, template, options) {
        this.template = template;
        this.dataset = {
            data: options?.dataset,
            actions: options?.actions,
            computed: options?.computed
        };
        if (options?.properties) {
            let _attributes = original.getAttributeNames();
            for (const attr of options.properties) {
                let _attribute = _attributes.find(a => a.includes(attr));
                if (_attribute != null) {
                    this.attributes.push({
                        prop: attr,
                        ref: this.element?.getAttribute(_attribute),
                        dynamic: this.element?.getAttribute(_attribute)?.match(Collection.regexp.brackets) != null || _attribute.includes(":")
                    });
                }
                else {
                    this.attributes.push({
                        prop: attr,
                        ref: null,
                        dynamic: false
                    });
                }
            }
        }
        if (options?.events) {
            for (let event of options.events) {
                this._handler.on(event.name, event.action);
            }
        }
        if (options?.settings)
            this.settings = options.settings;
        if (options?.content)
            this.content_tags = options.content;
        let _render = this.getRender();
        this.vtemplate_children = this.getTemplatechildren(_render, this.settings);
        this.load(_render);
    }
    setup() {
        try {
            super.setup();
            for (const child of this.vtemplate_children) {
                child.setup();
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    async update(recursive, options) {
        try {
            return super.update(recursive, options).then((node) => {
                if (recursive && !this._commands.find(c => c instanceof cFor)) {
                    for (const child of node.vtemplate_children) {
                        child.update(recursive, options);
                    }
                }
                return node;
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            return this;
        }
    }
    async buildContext(parent_context) {
        let _update;
        if (this._commands.find(c => c instanceof cFor))
            _update = { exclude: [this.id] };
        return Support.elaborateContext(this.dataset.data, { handler: this._handler, node: this, update: _update }, this.dataset.actions, this.dataset.computed)
            .then((output) => {
            output["__node"] = this;
            for (const attr of this.attributes) {
                ref(output, attr.prop, attr.ref, {
                    handler: this._handler,
                    node: this,
                    get: (_target, _key, _context) => {
                        if (attr.ref) {
                            return attr.dynamic ? elaborateContent(attr.ref, parent_context) : attr.ref;
                        }
                        return null;
                    },
                    set: (_target, _key, newvalue) => {
                        if (attr.dynamic && attr.ref != null) {
                            Support.setValue(parent_context, attr.ref, newvalue);
                        }
                    },
                    update: _update
                });
            }
            return output;
        });
    }
    /**Elaborate template's document fragment */
    getRender() {
        return Support.templateFromString(this.template);
    }
    /**Elaborate template's virtual nodes  */
    getTemplatechildren(render, settings) {
        let _children = [];
        for (const child of Array.from(render.childNodes)) {
            let _virtual = vNode.newInstance(child, settings);
            _children.push(_virtual);
        }
        return _children;
    }
    /**Elaborate complete template replacement */
    load(render) {
        try {
            //Collecting all non commands and out of dataet attributes of custom tag
            let _attributes = [];
            if (this.element) {
                for (const item of this.element?.getAttributeNames()) {
                    if (!this.attributes.find(a => a.prop == item) && command_matches.find(k => item.match(k.key)) == null) {
                        _attributes.push(item);
                    }
                }
            }
            let _content = document.createDocumentFragment(); //create container for 'out of template's context' items collectionù
            //Get 'out of template's context' children
            let _reference = this.reference[0];
            while (_reference.childNodes.length) {
                _content.append(_reference.childNodes[0]);
            }
            //replace in render all 'out of template's context' children with tag
            if (this.content_tags.length) {
                for (let tag of this.content_tags) {
                    let _element = _content.querySelector("[content='" + tag + "']");
                    let _insider = render.getElementById(tag);
                    if (_element && _insider) {
                        _element.removeAttribute("content");
                        _insider.parentNode?.replaceChild(_element, _insider);
                    }
                }
            }
            else {
                while (_content.childNodes.length) {
                    render.firstChild?.appendChild(_content.childNodes[0]);
                }
            }
            //Copying all extra custom tag's attributes on first render child node if it is a Node Element
            if (render.firstChild?.nodeType == Node.ELEMENT_NODE) {
                let _element = render.firstChild;
                for (const attr of _attributes) {
                    _element.setAttribute(attr, (_element.hasAttribute(attr) ? _element.getAttribute(attr) + " " : "") + this.element?.getAttribute(attr));
                }
            }
            this._handler.trigger(Collection.node_event.render, render, this);
            this._incubator = render;
            this.replaceNodes();
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    elaborateChildren(node) {
        super.elaborateChildren(node);
        this.buildContext(node.context).then((context) => {
            this._handler.trigger(Collection.node_event.dataset, context).then(() => {
                if (!node._commands.find(c => c instanceof cFor)) { //exclude for because of auto elaboration of command
                    for (const child of node.vtemplate_children) {
                        child.elaborate(context, node.settings);
                    }
                }
            });
        });
    }
}
