import { Support } from "./library.js";
import { iComponent, Settings } from "./types.js";
import { Collection, command_matches } from "./enumerators.js";
import { CommandVisitor, cBind, cFor, cIf, cModel, cOn } from "./commands.js";
import { _vault_key, elaborateContent, react, ref, renderBrackets } from "./reactive.js";
import EventHandler from "./events.js";
import log from "./console.js";
import TaskManager from "./pipeline.js";
/**Virtualized Node */
export class vNode {
    /**Return new instance of virtual node */
    static newInstance(reference, parent) {
        let component = globalThis.my_components?.find(c => c.name.toUpperCase() == reference.nodeName.toUpperCase());
        if (component == null)
            return new vNode(reference, parent);
        let _clone = {};
        if ("options" in component && component.options != null) {
            _clone = Object.create(component.options);
            if ("dataset" in component.options)
                _clone.dataset = JSON.parse(JSON.stringify(component.options.dataset));
            if ("storage" in component.options)
                _clone.storage = JSON.parse(JSON.stringify(component.options.storage));
        }
        return new vTemplate(reference, component.template, _clone, parent);
        // let _component = globalThis.my_components?.find(c => c.name.toUpperCase() == reference.nodeName.toUpperCase());
        // return _component != null ? new vTemplate(reference, _component.template, _component.options, parent) : new vNode(reference, parent);
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
    settings = new Settings();
    /**Unreactive dataset */
    storage = {};
    //#endregion
    //#region PRIVATE
    _handler = new EventHandler(this.context); //events utility management
    _incubator = document.createDocumentFragment(); //node's space for rendering elaboration
    _reference = []; //node reference
    _commands = []; //list of framework commands stored in virtual Node
    _command_visitor = new CommandVisitor(this); //commands Visitor for interaction
    _state = Collection.lifecycle.initialized; //private node state store
    _children = []; //virtual children
    _flag = null; //flag comment in html for elaboration reference
    _parent;
    //#endregion
    //#region PROPERTIES
    set state(value) {
        this._state = value;
        this.trigger(Collection.node_event.progress, this.state);
    }
    /**State of node's elaboration */
    get state() { return this._state; }
    get isElement() { return this.backup.nodeType == Node.ELEMENT_NODE; }
    /**Original element in case node is HTML Element */
    get element() { return this.isElement ? this.backup : null; }
    /**Node's children */
    get children() { return this._children; }
    /**Reference for elaboration space */
    get incubator() { return this._incubator; }
    /**Reference container */
    get reference() { return this._reference; }
    /**Reference container */
    get firstChild() { return this._reference[0] || undefined; }
    /**Type of node */
    get nodeType() { return this.backup.nodeType; }
    /**Node name */
    get nodeName() { return this.backup.nodeName; }
    /**Get if vnode has commands that drive node rendering like loop or conditional commands */
    get commandDriven() { return this._commands.find(c => c instanceof cIf || c instanceof cFor) != null; }
    /**temporary vnode's reference on DOM  */
    get flag() {
        if (this._flag == null)
            this._flag = document.createComment("#NODE " + this.id);
        return this._flag;
    }
    /**Parent virtual node */
    get parent() { return this._parent; }
    /**Get if node is application root */
    get root() { return this.parent == null; }
    /**Get this application root virtual node */
    get application() { return this.parent?.context[Collection.KeyWords.app] || undefined; }
    /**
     * Get Node's event handler
     * @date 8/4/2024 - 12:31:54
     *
     * @readonly
     * @type {EventHandler}
     */
    get handler() { return this._handler; }
    //#endregion
    constructor(original, parent) {
        this.id = Support.uniqueID();
        this.state = Collection.lifecycle.creating;
        this.backup = original.cloneNode(true);
        this.static = false;
        this._parent = parent;
        this.create(original);
    }
    //#region LIFECYCLE
    /**Initialization of virtual node
     *  - store commands
     *  - define staticness
     *  - map children
     *  - define vnode's reference
     */
    create(original) {
        try {
            if (original.nodeType == Node.ELEMENT_NODE) {
                this.checkCommands(original);
                if (!this.commandDriven)
                    this.mapChildren(original);
            }
            this.static = this.checkIfStatic();
            original.virtual = this;
            this.reference.push(original);
            this.state = Collection.lifecycle.created;
            this.trigger(Collection.node_event.virtualized, this);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Definition of node's dynamic elements like commands */
    async setup() {
        try {
            this.state = Collection.lifecycle.setup;
            this.updateSettings(this.parent?.settings);
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
            await this.setupChildren();
            this.trigger(Collection.node_event.setup, this._commands);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**First elaboration of node, context definition and rendering  */
    async elaborate(context, storage) {
        this.state = Collection.lifecycle.mounting;
        if (Support.debug(this.settings) && this.reference.length && this.reference[0].nodeType == Node.ELEMENT_NODE) {
            this.reference[0].setAttribute("data-id", this.id);
        }
        try {
            await this.elaborateContext(context, storage);
            await this.render();
            this.onInject(async (node) => { node.elaborate(this._handler.Context); });
            await this.elaborateChildren();
            this.state = Collection.lifecycle.mounted;
            this.state = Collection.lifecycle.ready;
            this.trigger(Collection.node_event.render, this.firstChild);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Update node and node's children rendering */
    async update() {
        this.state = Collection.lifecycle.updating;
        try {
            await this.render();
            await this.updateChildren().then(() => {
                this.state = Collection.lifecycle.updated;
                this.state = Collection.lifecycle.ready;
                this.trigger(Collection.node_event.render, this.firstChild);
            });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Render node */
    async render() {
        if (!this.static) {
            switch (this.nodeType) {
                case Node.ELEMENT_NODE:
                    if (this._commands.find(c => c instanceof cIf) != null) {
                        this._commands.forEach(c => { if (c instanceof cIf)
                            c.render(this); });
                    }
                    else {
                        if (this._commands.find(c => c instanceof cFor) != null) {
                            this._commands.forEach(c => { if (c instanceof cFor)
                                c.render(this); });
                        }
                        else {
                            for (let comm of this._commands) {
                                comm.render(this);
                            }
                        }
                    }
                    break;
                case Node.TEXT_NODE:
                    if (this.backup.nodeValue) {
                        let _debug = renderBrackets(this.backup.nodeValue, this.context, this.settings);
                        this.incubator.textContent = "";
                        if (_debug && typeof _debug == "string") {
                            let temp = Support.templateFromString(_debug);
                            while (temp.childNodes.length) {
                                if (temp.firstChild) {
                                    let tempVNode = vNode.newInstance(temp.firstChild, this.parent);
                                    tempVNode.setup();
                                    tempVNode.elaborate();
                                    for (var render of tempVNode.reference) {
                                        this.incubator.append(render);
                                    }
                                }
                            }
                        }
                        this.replaceNodes();
                        if (Support.debug(this.settings, Collection.debug_mode.command))
                            log({ command: this.id + " - TEXT", value: _debug, origin: this.backup.nodeValue }, Collection.message_type.debug);
                    }
                    break;
            }
        }
    }
    /**Remove all references from child to itself */
    async dismiss() {
        try {
            this.state = Collection.lifecycle.unmounting;
            for (var child of this.children) {
                child.dismiss();
            }
            this._children = [];
            if (this.reference.length) {
                for (var element of this.reference) {
                    if (element.nodeType == Node.ELEMENT_NODE) {
                        element.remove();
                    }
                }
            }
            this.state = Collection.lifecycle.unmounted;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    //#endregion
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
    /**Setup Node's context */
    async elaborateContext(context, storage) {
        this.context = context ?? this.parent?.context ?? {};
        this.storage = storage ?? this.parent?.storage ?? {};
        this._handler.setContext(this.context);
        this.trigger(Collection.node_event.dataset, this.context);
    }
    /**Update node settings and children settings*/
    updateSettings(settings) {
        if (settings != null) {
            this.settings.merge(settings);
            for (const child of this.children) {
                child.updateSettings(settings);
            }
        }
    }
    setKeywords(collection) {
        let node = this;
        Object.defineProperty(collection, Collection.KeyWords.node, { get() { return node; } });
        Object.defineProperty(collection, Collection.KeyWords.reference, { get() { return node.firstChild; } });
        Object.defineProperty(collection, Collection.KeyWords.app, { get() { return node.application; } });
        Object.defineProperty(collection, Collection.KeyWords.storage, { get() { return node.storage; } });
        return collection;
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
    trigger(name, ...args) {
        this._handler.trigger(name, ...args);
    }
    on(name, action) {
        this._handler.on(name, action);
    }
    //#endregion
    //#region HTML
    /**Inject element as last children */
    append(node, index = 0) {
        try {
            if (this.reference[index] && this.reference[index].nodeType == Node.ELEMENT_NODE) {
                this.reference[index].append(node);
                let _node = vNode.newInstance(node, this);
                _node.updateSettings(this.settings);
                _node.setup();
                this.setupChildEvents(_node);
                this._children.push(_node);
                this.trigger(Collection.node_event.inject, _node);
            }
            else {
                log("Impossible to append at " + this.id + " node cause it is not an Element Node", Collection.message_type.warning);
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Inject new element as first children */
    prepend(node, index = 0) {
        try {
            if (this.reference[index] && this.reference[index].nodeType == Node.ELEMENT_NODE) {
                this.reference[index].prepend(node);
                let _node = vNode.newInstance(node, this);
                _node.updateSettings(this.settings);
                _node.setup();
                this.setupChildEvents(_node);
                this._children = this._children.prepend(_node);
                this.trigger(Collection.node_event.inject, _node);
            }
            else {
                log("Impossible to prepend at " + this.id + " node cause it is not an Element Node", Collection.message_type.warning);
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace first reference DOM element with another */
    replaceWith(node) {
        try {
            let _virtual = vNode.newInstance(node, this);
            _virtual.updateSettings(this.settings);
            _virtual.setup();
            this.setupChildEvents(_virtual);
            let _parent = this.reference[0]?.parentNode;
            if (_parent) {
                _parent.replaceChild(node, this.reference[0]);
                _parent.virtual?.replaceChild(_virtual);
                _parent.virtual?.trigger(Collection.node_event.inject, _virtual);
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace reference with incubator's content or place a flag if incubator is empty*/
    replaceNodes() {
        try {
            this.placeFlag((node) => {
                if (node.reference.length) {
                    // (<HTMLElement>node.reference[node.reference.length - 1]).after(node.flag);
                    for (let ref of node.reference) {
                        ref.remove();
                    }
                    node._reference = [];
                }
                if (node.incubator.childNodes.length) {
                    for (let newnode of Array.from(node.incubator.childNodes)) {
                        node.flag.before(newnode);
                        node.reference.push(newnode);
                    }
                    return true;
                }
                return false;
            }, true);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace reference node with a given html template*/
    replaceHtmlContent(new_content) {
        try {
            this.placeFlag((node) => {
                node.incubator.textContent = "";
                let content = [];
                let temp_node = Support.templateFromString(new_content).firstChild;
                do {
                    if (temp_node) {
                        let virtual = vNode.newInstance(temp_node, node);
                        virtual.setup();
                        virtual.elaborate();
                        content.push(virtual);
                    }
                    temp_node = temp_node?.nextSibling;
                } while (temp_node != null);
                for (const item of content) {
                    for (const child of item.reference) {
                        node.incubator.appendChild(child);
                    }
                }
                let _output = node.incubator.childNodes.length > 0;
                node.replaceNodes();
                return _output;
            }, true);
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Run elaboration afer inject node flag in dom */
    placeFlag(elaborate, bottom = false) {
        let _position = bottom ? this.reference.length - 1 : 0;
        if (this._reference.length > 0)
            this.reference[_position].after(this.flag);
        if (elaborate(this))
            this.flag.remove();
    }
    hasAttribute(attribute) {
        return this.isElement ? this.element?.hasAttribute(attribute) : false;
    }
    //#endregion
    //#region CHILDREN
    /**Remove children based on filter, if filter is empty it remove all children */
    removeChildren(filter) {
        try {
            if (filter) {
                let _filtered = this._children.filter((e) => filter(e));
                for (const child of _filtered) {
                    child.dismiss();
                }
                this._children = _filtered;
            }
            else {
                this._children = [];
                if (this.reference && this.reference.length && this.reference[0].nodeType == Node.ELEMENT_NODE)
                    this.reference[0].innerHTML = "";
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace virtual child with another */
    replaceChild(vnode) {
        let _child = this._children.find((e) => e.id == this.id);
        if (_child)
            _child = vnode;
    }
    /**Store children nodes as virtual nodes */
    mapChildren(element) {
        try {
            let _children = element.childNodes;
            for (const child of Array.from(_children)) {
                if (this.checkChild(child)) {
                    let _node = vNode.newInstance(child, this);
                    this.setupChildEvents(_node);
                    this.children.push(_node);
                }
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    /**Check if child contains conditional rendering commands */
    checkChild(child) {
        if (child.nodeType == Node.ELEMENT_NODE)
            return child.getAttributeNames().find(a => a == cIf.key_else || a == cIf.key_elseif) == null;
        if (child.nodeType == Node.TEXT_NODE)
            return child.nodeValue?.replace(/[\\n\s]*/g, "") != "";
        return true;
    }
    /**Setup children */
    async setupChildren() {
        let _setup = [];
        for (const child of this.children) {
            _setup.push(child.setup());
        }
        return Promise.all(_setup);
    }
    /**Run first elaboration command to all children */
    async elaborateChildren() {
        let _elabs = [];
        if (!this._commands.find((c) => c instanceof cFor)) { //exclude for because of auto elaboration of command
            for (const child of this.children) {
                _elabs.push(child.elaborate());
            }
        }
        return Promise.all(_elabs);
    }
    /**Update  node's children */
    async updateChildren() {
        let _updates = [];
        for (const child of this.children) {
            _updates.push(child.update());
        }
        return Promise.all(_updates);
    }
    /**Setup default events on children */
    setupChildEvents(_node) {
        _node.onProgress((state) => {
            if (state == Collection.lifecycle.unmounted) {
                this._children = this._children.filter((c) => c.id != _node.id);
            }
        });
    }
    /**Check in original document if this element or its parents has one or more specified tag properties between class, nodeName and attributes */
    childOf(query) {
        return this.isElement && Support.checkQuery(this.backup, query) ? true :
            (this.parent ? this.parent.childOf(query) : false);
    }
    /**
     * Get first element's parent vnode that match query selector
     * @date 29/3/2024 - 13:45:14
     *
     * @param {QueryElement} query the query selector
     * @returns {(vNode | undefined)}
     */
    getParent(query) {
        return this.isElement && Support.checkQuery(this.backup, query) ? this : this.parent?.getParent(query);
    }
    /**
     * Get first element's child vnode that match query selector
     * @date 29/3/2024 - 13:45:14
     *
     * @param {QueryElement | string} query the query selector
     * @returns {(vNode | undefined)}
     */
    getChild(query) {
        if (this.isElement && Support.checkQuery(this.backup, query)) {
            return this;
        }
        else {
            for (const child of this.children) {
                var wanted = child.getChild(query);
                if (wanted)
                    return wanted;
            }
        }
        return undefined;
    }
    /**
     * Get first element's child context that match query selector
     * @date 29/3/2024 - 13:45:14
     *
     * @param {QueryElement | string} query the query selector
     * @returns {(vNode | undefined)}
     */
    getChildContext(query) {
        if (this.isElement) {
            if (Support.checkQuery(this.backup, query)) {
                return this._handler.Context;
            }
            else {
                for (const child of this.children) {
                    var wanted = child.getChildContext(query);
                    if (wanted)
                        return wanted;
                }
            }
        }
        return undefined;
    }
}
/**vTemplate is the vDOM rappresentation of Components, it is an extension of vNode but with some semi-independant application features*/
export class vTemplate extends vNode {
    template = ""; // component's html code
    vtemplate_children = []; //component's vDOM children only
    attributes = [];
    ; //component's paramters
    data_options = {}; //base dataset for context
    pipeline = new TaskManager();
    constructor(reference, template, options, parent) {
        super(reference, parent);
        this.createTemplate(reference, template, options);
        this.load();
        this._handler.on(Collection.application_event.update, () => {
            this.pipeline.add(() => this.update());
        });
    }
    /**Prepare template data for processing */
    createTemplate(original, template, options) {
        this.template = template;
        this.data_options = options instanceof iComponent ? options : {
            dataset: options?.dataset,
            actions: options?.actions,
            computed: options?.computed,
            storage: options?.storage,
        };
        if (options && options.settings != null)
            this.updateSettings(options?.settings);
        if (options && options.inputs != null)
            this.setupAttributes(options.inputs, original);
        if (options && options.events != null)
            this.setupEvents(options.events);
        this._incubator = this.getRender();
        if (!this.commandDriven)
            this.vtemplate_children = this.mapTemplatechildren(this.incubator);
    }
    /**Elaborate template's document fragment */
    getRender() {
        return Support.templateFromString(this.template);
    }
    /**Elaborate complete template replacement */
    load() {
        try {
            //Collecting all non commands and out of dataset attributes of custom tag
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
            var slots = this.incubator.querySelectorAll("slot");
            for (const _slot of Array.from(slots)) {
                var element = _content.querySelector("[slot='" + _slot.getAttribute("name") + "']");
                if (element) {
                    element.removeAttribute("slot");
                    _slot.parentNode?.replaceChild(element, _slot);
                }
            }
            while (_content.childNodes.length) {
                this.incubator.firstChild?.appendChild(_content.childNodes[0]);
            }
            //Copying all extra custom tag's attributes on first render child node if it is a Node Element
            if (this.incubator.firstChild?.nodeType == Node.ELEMENT_NODE) {
                let _element = this.incubator.firstChild;
                for (const attr of _attributes) {
                    _element.setAttribute(attr, (_element.hasAttribute(attr) ? _element.getAttribute(attr) + " " : "") + this.element?.getAttribute(attr));
                }
            }
            //this.trigger(Collection.node_event.render, this.incubator, this);
            this.incubator.querySelectorAll("ref").forEach(e => e.remove());
            this.replaceNodes();
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    setupEvents(eventList) {
        for (let event of eventList) {
            this._handler.on(event.name, event.action);
        }
    }
    setupAttributes(inputs, original) {
        let _attributes = original.getAttributeNames();
        for (const attr of inputs) {
            let _attribute = _attributes.find(a => a.includes(attr));
            if (_attribute != null) {
                this.attributes.push({
                    name: _attribute,
                    prop: attr,
                    ref: this.element?.getAttribute(_attribute),
                    dynamic: this.element?.getAttribute(_attribute)?.match(Collection.regexp.brackets) != null || _attribute.includes(":")
                });
                this._commands = this._commands.filter(c => c.attribute?.name.toUpperCase() != _attribute?.toUpperCase());
            }
            else {
                this.attributes.push({
                    name: "",
                    prop: attr,
                    ref: null,
                    dynamic: false
                });
            }
        }
    }
    async dismiss() {
        try {
            this.state = Collection.lifecycle.unmounting;
            for (var child of this.vtemplate_children) {
                child.dismiss();
            }
            this.vtemplate_children = [];
            await super.dismiss();
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Like the application's relative method, it defines a unique data context,
     * but the passed variable's proxy is linked to the relative in the parent context instead of updating all vdom. */
    async buildContext() {
        this.state = Collection.lifecycle.context_creating;
        const newLocal = { handler: this._handler, node: this };
        if (this.data_options instanceof iComponent) { //definition by class
            for (const key of Object.getOwnPropertyNames(this.data_options)) {
                if (Support.isPrimitive(Reflect.get(this.data_options, key)))
                    ref(this.data_options, key, Reflect.get(this.data_options, key), newLocal);
                else
                    Reflect.set(this.data_options, key, react(Reflect.get(this.data_options, key), newLocal));
            }
            for (const attr of this.attributes) {
                ref(this.data_options, attr.prop, attr.ref || Reflect.get(this.data_options, attr.prop) || "", {
                    handler: this._handler,
                    node: this,
                    get: (_target, _key, _context) => {
                        if (attr.ref)
                            return attr.dynamic ? elaborateContent(attr.ref, this.context) || "" : attr.ref;
                        return Support.getValue(_target, _vault_key + "." + _key);
                    },
                    set: (_target, _key, newvalue) => {
                        if (attr.ref != null && attr.dynamic) {
                            if (Reflect.get(this.context, attr.ref) !== newvalue)
                                Support.setValue(this.context, attr.ref, newvalue);
                        }
                        else {
                            if (Reflect.get(_target, _key) !== newvalue)
                                Support.setValue(_target, _vault_key + "." + _key, newvalue);
                        }
                    }
                });
            }
            this.data_options = this.setKeywords(this.data_options);
            return react(this.data_options, newLocal);
        }
        else { //definition by object
            return Support.elaborateContext({}, this.data_options.dataset, newLocal, this.data_options.actions, this.data_options.computed)
                .then((output) => {
                for (const attr of this.attributes) {
                    if (!(attr.prop in output && attr.name == "")) {
                        var options = {
                            handler: this._handler,
                            node: this,
                            get: (_target, _key, _context) => {
                                if (attr.ref) {
                                    return attr.dynamic ? elaborateContent(attr.ref, this.context) || "" : attr.ref;
                                }
                                return Support.getValue(_target, _vault_key + "." + _key);
                            },
                            set: (_target, _key, newvalue) => {
                                if (attr.dynamic && attr.ref != null) {
                                    if (Reflect.get(this.context, attr.ref) !== newvalue)
                                        Support.setValue(this.context, attr.ref, newvalue);
                                }
                                else {
                                    if (Reflect.get(_target, _key) !== newvalue)
                                        Support.setValue(_target, _vault_key + "." + _key, newvalue);
                                }
                            }
                        };
                        ref(output, attr.prop, attr.ref, options);
                        if (attr.name && output[Collection.KeyWords.reference])
                            output[Collection.KeyWords.reference].removeAttribute(attr.name);
                    }
                }
                output = this.setKeywords(output);
                return react(output, newLocal);
            });
        }
    }
    async elaborateContext(context, storage) {
        this.storage = this.data_options.storage ? Support.deepClone(this.data_options?.storage) : (storage ?? this.parent?.storage ?? {});
        await this.buildContext().then((template_context) => {
            this.context = context ?? this.parent?.context ?? template_context ?? {};
            this._handler.setContext(template_context ?? {});
            this.state = Collection.lifecycle.context_created;
            this.trigger(Collection.node_event.dataset, template_context);
        });
    }
    setKeywords(collection) {
        let node = this;
        Object.defineProperty(collection, Collection.KeyWords.node, { get() { return node; } });
        Object.defineProperty(collection, Collection.KeyWords.reference, { get() { return node.firstChild?.virtual?.firstChild; } });
        Object.defineProperty(collection, Collection.KeyWords.app, { get() { return node.application; } });
        Object.defineProperty(collection, Collection.KeyWords.storage, { get() { return node.storage; } });
        return collection;
    }
    /**Elaborate template's virtual nodes  */
    mapTemplatechildren(render) {
        let _children = [];
        for (const child of Array.from(render.childNodes)) {
            if (this.checkChild(child)) {
                let _node = vNode.newInstance(child, this);
                this.setupChildEvents(_node);
                _children.push(_node);
            }
        }
        return _children;
    }
    async setupChildren() {
        return super.setupChildren().then(() => {
            var _setup = [];
            //exclude for because of auto elaboration of command
            for (const child of this.vtemplate_children) {
                _setup.push(child.setup());
            }
            return Promise.all(_setup);
        });
    }
    /**Processes the children of the component using its personal context
     * and injected children with the inherited context  */
    async elaborateChildren() {
        return super.elaborateChildren().then(() => {
            var _elabs = [];
            //exclude for because of auto elaboration of command
            if (!this._commands.find((c) => c instanceof cFor)) {
                for (const child of this.vtemplate_children) {
                    _elabs.push(child.elaborate(this._handler.Context || this.context));
                }
            }
            return Promise.all(_elabs);
        });
    }
    async updateChildren() {
        return super.updateChildren().then(() => {
            var _elabs = [];
            //exclude for because of auto elaboration of command
            for (const child of this.vtemplate_children) {
                _elabs.push(child.update());
            }
            return Promise.all(_elabs);
        });
    }
    /**Update node settings and children settings in cascade*/
    updateSettings(settings) {
        if (settings != null) {
            super.updateSettings(settings);
            for (const child of this.vtemplate_children) {
                child.updateSettings(settings);
            }
        }
    }
    /**
     * Get first element's child vnode that match query selector
     * @date 29/3/2024 - 13:45:14
     *
     * @param {QueryElement} query the query selector
     * @returns {(vNode | undefined)}
     */
    getChild(query) {
        if (this.isElement && Support.checkQuery(this.backup, query)) {
            return this;
        }
        else {
            for (const child of this.vtemplate_children) {
                var wanted = superGetChild(child, query);
                if (wanted)
                    return wanted;
            }
        }
        return undefined;
        function superGetChild(node, query) {
            if (node.isElement && Support.checkQuery(node.backup, query)) {
                return node;
            }
            else {
                for (const child of node.children) {
                    var wanted = superGetChild(child, query);
                    if (wanted)
                        return wanted;
                }
            }
            return undefined;
        }
    }
    /**
     * Get first element's child context that match query selector
     * @date 29/3/2024 - 13:45:14
     *
     * @param {QueryElement} query the query selector
     * @returns {(vNode | undefined)}
     */
    getChildContext(query) {
        if (this.isElement && Support.checkQuery(this.backup, query)) {
            return this._handler.Context;
        }
        else {
            for (const child of this.vtemplate_children) {
                var wanted = superGetChild(child, query);
                if (wanted)
                    return wanted;
            }
        }
        return undefined;
        function superGetChild(node, query) {
            if (node.isElement && Support.checkQuery(node.backup, query)) {
                return node.handler.Context;
            }
            else {
                for (const child of node.children) {
                    var wanted = superGetChild(child, query);
                    if (wanted)
                        return wanted;
                }
            }
            return undefined;
        }
    }
}
