import { Support } from "./library.js";
import { Collection, command_matches } from "./enumerators.js";
import { CommandVisitor, cBind, cFor, cIf, cModel, cOn } from "./commands.js";
import { _vault_key, elaborateContent, react, ref, renderBrackets } from "./reactive.js";
import EventHandler from "./events.js";
import log from "./console.js";
export class vNode {
    /**Return new instance of virtual node */
    static newInstance(reference, parent) {
        let _component = globalThis.my_components?.find(c => c.name.toUpperCase() == reference.nodeName.toUpperCase());
        return _component != null ? new vTemplate(reference, _component.template, _component.options, parent) : new vNode(reference, parent);
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
    settings = { debug: true, debug_mode: Collection.debug_mode.all };
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
        this._handler.trigger(Collection.node_event.progress, this.current_state);
    }
    /**State of node's elaboration */
    get state() { return this._state; }
    get current_state() { return Collection.lifecycle[this.state]; }
    get isElement() { return this.backup.nodeType == Node.ELEMENT_NODE; }
    /**Original element in case node is HTML Element */
    get element() { return this.isElement ? this.backup : null; }
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
    get application() { return this.parent ? this.parent.application : this; }
    //#endregion
    constructor(original, parent) {
        this.id = Support.uniqueID();
        this.state = Collection.lifecycle.creating;
        this.backup = original.cloneNode(true);
        this.static = false;
        this._parent = parent;
        this.create(original);
    }
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
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Definition of node's dynamic elements like commands */
    async setup() {
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
            for (const child of this.children) {
                child.setup();
            }
            this.state = Collection.lifecycle.setup;
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**First elaboration of node, context definition and rendering  */
    async elaborate(context) {
        if (this.parent)
            this.mergeSettings(this.parent?.settings);
        if (Support.debug(this.settings) && this.reference.length && this.reference[0].nodeType == Node.ELEMENT_NODE) {
            this.reference[0].setAttribute("data-id", this.id);
        }
        this.state = Collection.lifecycle.mounting;
        try {
            let processes = [];
            this.context = context ?
                context : (this.parent ?
                this.parent.context : {});
            this._handler.setContext(this.context);
            processes.push(this.render().then(() => {
                this.state = Collection.lifecycle.mounted;
            }));
            processes.push(this.elaborateChildren());
            this.onInject(async (node) => { node.elaborate(); });
            await Promise.all(processes).then(() => { this.state = Collection.lifecycle.ready; });
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Update node and node's child rendering */
    async update() {
        this.state = Collection.lifecycle.updating;
        let processes = [];
        try {
            processes.push(this.render().then(() => {
                this.state = Collection.lifecycle.updated;
            }));
            for (const child of this.children) {
                processes.push(child.update());
            }
            await Promise.all(processes).then(() => { this.state = Collection.lifecycle.ready; });
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
                        this.reference[0].nodeValue = _debug;
                        if (Support.debug(this.settings, Collection.debug_mode.command))
                            log({ command: this.id + " - TEXT", value: _debug, origin: this.backup.nodeValue }, Collection.message_type.debug);
                    }
                    break;
            }
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
    /**Merge parent Settings with personal settings */
    mergeSettings(settings) {
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
                this._handler.trigger(Collection.node_event.inject, _node);
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
                this._handler.trigger(Collection.node_event.inject, _node);
            }
            else {
                log("Impossible to prepend at " + this.id + " node cause it is not an Element Node", Collection.message_type.warning);
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Remove node from virtualizer and DOM*/
    clear() {
        try {
            this.state = Collection.lifecycle.unmounting;
            if (this.reference.length) {
                for (const element of this.reference) {
                    element.remove();
                }
            }
            this.state = Collection.lifecycle.unmounted;
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
                        virtual.elaborate(node.context);
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
                    child.clear();
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
                    _node.updateSettings(this.settings);
                    this.setupChildEvents(_node);
                    this.children.push(_node);
                }
            }
        }
        catch (ex) {
            throw ex;
        }
    } /**Check if child contains conditional rendering commands */
    checkChild(child) {
        if (child.nodeType == Node.ELEMENT_NODE)
            return child.getAttributeNames().find(a => a == cIf.key_else || a == cIf.key_elseif) == null;
        if (child.nodeType == Node.TEXT_NODE)
            return child.nodeValue?.replace(/[\\n\s]*/g, "") != "";
        return true;
    }
    /**Run first elaboration command to all children */
    async elaborateChildren() {
        if (!this._commands.find((c) => c instanceof cFor)) { //exclude for because of auto elaboration of command
            for (const child of this.children) {
                child.elaborate();
            }
        }
    }
    /**Setup default events on children */
    setupChildEvents(_node) {
        _node.onProgress((state) => {
            if (state == Collection.lifecycle.unmounted) {
                this._children = this._children.filter((c) => c.id != _node.id);
            }
        });
    }
    //#endregion
    /**Update node settings and children settings in cascade*/
    updateSettings(settings) {
        this.mergeSettings(settings);
        for (const child of this.children) {
            child.updateSettings(settings);
        }
    }
}
/**virtual node for templates */
export class vTemplate extends vNode {
    template = "";
    vtemplate_children = [];
    attributes = [];
    slots = [];
    dataset = {};
    constructor(reference, template, options, parent) {
        super(reference, parent);
        if (options && "settings" in options)
            this.updateSettings(options?.settings);
        this.createTemplate(reference, template, options);
        this._handler.on(Collection.application_event.update, () => { this.update(); });
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
                        name: _attribute,
                        prop: attr,
                        ref: this.element?.getAttribute(_attribute),
                        dynamic: this.element?.getAttribute(_attribute)?.match(Collection.regexp.brackets) != null || _attribute.includes(":")
                    });
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
        if (options?.events) {
            for (let event of options.events) {
                this._handler.on(event.name, event.action);
            }
        }
        if (options?.slots)
            this.slots = options.slots;
        this._incubator = this.getRender();
        if (!this.commandDriven)
            this.vtemplate_children = this.mapTemplatechildren(this.incubator, this.settings);
    }
    async setup() {
        try {
            this.load();
            await super.setup();
            for (const child of this.vtemplate_children) {
                child.setup();
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    async update() {
        this.state = Collection.lifecycle.updating;
        try {
            this.render().then(() => {
                this.state = Collection.lifecycle.updated;
                for (const child of this.vtemplate_children) {
                    child.update();
                }
            });
            for (const child of this.children) {
                child.update();
            }
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    async buildContext() {
        this.state = Collection.lifecycle.context_creating;
        let _update;
        return Support.elaborateContext({}, this.dataset.data, { handler: this._handler, node: this, update: _update }, this.dataset.actions, this.dataset.computed)
            .then((output) => {
            output["__node"] = this;
            for (const attr of this.attributes) {
                if (!(attr.prop in output && attr.name == "")) {
                    let _options = {
                        handler: this._handler,
                        node: this,
                        get: (_target, _key, _context) => {
                            if (attr.ref) {
                                //parent.context ? 
                                return attr.dynamic ? elaborateContent(attr.ref, this.context) : attr.ref;
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
                    //output[attr.prop] = attr.ref;
                    ref(output, attr.prop, attr.ref, _options);
                    if (attr.name && this.reference.length > 0)
                        this.reference[0].removeAttribute(attr.name);
                }
            }
            return react(output, { handler: this._handler });
        });
    }
    /**Elaborate template's document fragment */
    getRender() {
        return Support.templateFromString(this.template);
    }
    /**Elaborate template's virtual nodes  */
    mapTemplatechildren(render, settings) {
        let _children = [];
        for (const child of Array.from(render.childNodes)) {
            if (this.checkChild(child)) {
                let _node = vNode.newInstance(child, this);
                _node.updateSettings(settings);
                this.setupChildEvents(_node);
                _children.push(_node);
            }
        }
        return _children;
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
            if (this.slots.length) {
                for (let tag of this.slots) {
                    let _element = _content.querySelector("*[slot='" + tag + "']");
                    let _insider = this.incubator.querySelector("slot[name='" + tag + "']");
                    if (_element && _insider) {
                        _element.removeAttribute("slot");
                        _insider.parentNode?.replaceChild(_element, _insider);
                    }
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
            this._handler.trigger(Collection.node_event.render, this.incubator, this);
            this.incubator.querySelectorAll("ref").forEach(e => e.remove());
            this.replaceNodes();
        }
        catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    async elaborateChildren() {
        super.elaborateChildren();
        this.buildContext().then((context) => {
            this._handler.setContext(context);
            this.state = Collection.lifecycle.context_created;
            //exclude for because of auto elaboration of command
            if (!this._commands.find((c) => c instanceof cFor)) {
                for (const child of this.vtemplate_children) {
                    child.elaborate(context);
                }
            }
        });
    }
}
