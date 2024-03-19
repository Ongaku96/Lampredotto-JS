import { Support } from "./library.js";
import { DataCollection, QueryElement, ReactivityOptions, Settings, TemplateOptions, UpdateOptions } from "./types.js";
import { Collection, command_matches } from "./enumerators.js";
import { Application } from "./application.js";
import { Command, CommandVisitor, cBind, cFor, cIf, cModel, cOn } from "./commands.js";
import { _vault_key, elaborateContent, react, ref, renderBrackets } from "./reactive.js";
import EventHandler from "./events.js";
import log from "./console.js";

/**Virtualized Node */
export class vNode {
    /**Return new instance of virtual node */
    static newInstance(reference: Node, parent?: vNode) {
        let _component = globalThis.my_components?.find(c => c.name.toUpperCase() == reference.nodeName.toUpperCase());
        return _component != null ? new vTemplate(reference, _component.template, _component.options, parent) : new vNode(reference, parent);
    }

    //#region PUBLIC
    /**virtual node identifier */
    public id: string;
    /**original html node element */
    public backup: Node;
    /**Get if node element have dynamic elements or not */
    public static: boolean;
    /**Data context of node */
    public context: DataCollection = {};
    /**Settings of node */
    public settings: Settings = new Settings();
    //#endregion

    //#region PRIVATE
    protected _handler: EventHandler = new EventHandler(this.context); //events utility management
    protected _incubator: DocumentFragment = document.createDocumentFragment(); //node's space for rendering elaboration
    protected _reference: Node[] = []; //node reference
    protected _commands: Command[] = []; //list of framework commands stored in virtual Node
    protected _command_visitor: CommandVisitor = new CommandVisitor(this); //commands Visitor for interaction
    protected _state: Collection.lifecycle = Collection.lifecycle.initialized; //private node state store
    protected _children: vNode[] = []; //virtual children
    protected _flag: Comment | null = null; //flag comment in html for elaboration reference
    protected _parent: vNode | undefined;
    //#endregion

    //#region PROPERTIES
    set state(value: Collection.lifecycle) {
        this._state = value;
        this._handler.trigger(Collection.node_event.progress, this.state);
    }
    /**State of node's elaboration */
    get state(): Collection.lifecycle { return this._state; }
    get isElement(): boolean { return this.backup.nodeType == Node.ELEMENT_NODE }
    /**Original element in case node is HTML Element */
    get element(): HTMLElement | null { return this.isElement ? <HTMLElement>this.backup : null; }
    /**Node's children */
    get children(): vNode[] { return this._children; }
    /**Reference for elaboration space */
    get incubator(): DocumentFragment { return this._incubator; }
    /**Reference container */
    get reference(): Node[] { return this._reference; }
    /**Reference container */
    get firstChild(): Node | undefined { return this._reference[0] || undefined; }
    /**Type of node */
    get nodeType(): Number { return this.backup.nodeType; }
    /**Node name */
    get nodeName(): string { return this.backup.nodeName; }
    /**Get if vnode has commands that drive node rendering like loop or conditional commands */
    get commandDriven(): boolean { return this._commands.find(c => c instanceof cIf || c instanceof cFor) != null; }
    /**temporary vnode's reference on DOM  */
    get flag(): Comment {
        if (this._flag == null) this._flag = document.createComment("#NODE " + this.id);
        return this._flag;
    }
    /**Parent virtual node */
    get parent(): vNode | undefined { return this._parent; }
    /**Get if node is application root */
    get root(): boolean { return this.parent == null; }
    /**Get this application root virtual node */
    get application(): Application | undefined { return this.parent?.context.__app || undefined; }
    //#endregion

    constructor(original: Node, parent?: vNode) {
        this.id = Support.uniqueID();
        this.updateSettings(this.parent?.settings);
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
    protected create(original: Node) {
        try {
            if (original.nodeType == Node.ELEMENT_NODE) {
                this.checkCommands(<HTMLElement>original);
                if (!this.commandDriven)
                    this.mapChildren(<HTMLElement>original);
            }
            this.static = this.checkIfStatic();
            original.virtual = this;
            this.reference.push(original);

            this.state = Collection.lifecycle.created;

            this._handler.trigger(Collection.node_event.virtualized, this);
        } catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Definition of node's dynamic elements like commands */
    async setup() {
        try {
            this.state = Collection.lifecycle.setup;
            if (!this.static) {
                this.incubator.appendChild(this.backup.cloneNode(false));
                for (let comm of this._commands) {
                    if (comm instanceof cModel) this._command_visitor.visitModel(comm);
                    if (comm instanceof cOn) this._command_visitor.visitOn(comm);
                    if (comm instanceof cBind) this._command_visitor.visitBind(comm);
                    if (comm instanceof cIf) this._command_visitor.visitIf(comm);
                    if (comm instanceof cFor) this._command_visitor.visitFor(comm);
                }
            }
            await this.setupChildren();
            this._handler.trigger(Collection.node_event.setup, this._commands);
        } catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**First elaboration of node, context definition and rendering  */
    async elaborate(context?: DataCollection) {
        this.state = Collection.lifecycle.mounting;

        if (Support.debug(this.settings) && this.reference.length && this.reference[0].nodeType == Node.ELEMENT_NODE) {
            (<Element>this.reference[0]).setAttribute("data-id", this.id);
        }

        try {
            await this.elaborateContext(context);
            await this.render();
            this.onInject(async (node: vNode) => { node.elaborate(this._handler.Context); });
            await this.elaborateChildren();
            this.state = Collection.lifecycle.mounted;
            this.state = Collection.lifecycle.ready;
            this._handler.trigger(Collection.node_event.render, this.firstChild);
        } catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
        }
    }
    /**Update node and node's children rendering */
    async update() {
        this.state = Collection.lifecycle.updating;
        try {
            await this.render();
            await this.updateChildren();
            this.state = Collection.lifecycle.updated;
            this.state = Collection.lifecycle.ready;
            this._handler.trigger(Collection.node_event.render, this.firstChild);
        } catch (ex) {
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
                        this._commands.forEach(c => { if (c instanceof cIf) c.render(this); });
                    } else {
                        if (this._commands.find(c => c instanceof cFor) != null) {
                            this._commands.forEach(c => { if (c instanceof cFor) c.render(this); });
                        } else {
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
                        (<Element>element).remove();
                    }
                }
            }
            this.state = Collection.lifecycle.unmounted;
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    //#endregion

    //#region ELABORATION
    /**Conteol presence of commands attributes and store them in commands archive */
    protected checkCommands(element: HTMLElement) {
        try {
            let _attributes = element.attributes; //get list of node attributes
            for (let attr of Array.from(_attributes)) {
                let _key = command_matches.find(k => attr.name.match(k.key)); //check if this attribute is command reference 
                if (_key) { //store command based on attribute
                    this._commands.push(_key.value.clone(attr));
                }
            }
        } catch (ex) {
            throw ex;
        }
    }
    /**Check if node has dynamic elements */
    protected checkIfStatic() {
        if (this.backup.nodeType == Node.ELEMENT_NODE) {
            return this._commands.length == 0 && !checkDynamicAttribute(this.element);
        } else {
            return this.backup.nodeValue?.match(Collection.regexp.brackets) == null;
        }

        function checkDynamicAttribute(element: HTMLElement | null) {
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
    protected async elaborateContext(context?: DataCollection) {
        this.context = context || this.parent?.context || {};
        this._handler.setContext(this.context);
        this._handler.trigger(Collection.node_event.dataset, this.context);
    }
    /**Update node settings and children settings*/
    updateSettings(settings: Settings | undefined) {
        if (settings != null) {
            this.settings.merge(settings);

            for (const child of this.children) {
                child.updateSettings(settings);
            }
        }
    }
    //#endregion

    //#region EVENTS
    /**Define events on state's changes */
    onProgress(action: (...args: any[]) => any) {
        this._handler.on(Collection.node_event.progress, action);
    }
    onInject(action: (...args: any[]) => any) {
        this._handler.on(Collection.node_event.inject, action);
    }
    onDataset(action: (...args: any[]) => any) {
        this._handler.on(Collection.node_event.dataset, action);
    }
    trigger(name: string, ...args: any[]) {
        this._handler.trigger(name, ...args);
    }
    on(name: string, action: (...args: any[]) => any | void) {
        this._handler.on(name, action)
    }
    //#endregion

    //#region HTML
    /**Inject element as last children */
    append(node: Node, index: number = 0) {
        try {
            if (this.reference[index] && this.reference[index].nodeType == Node.ELEMENT_NODE) {
                (<HTMLElement>this.reference[index]).append(node);
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
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Inject new element as first children */
    prepend(node: HTMLElement, index: number = 0) {
        try {
            if (this.reference[index] && this.reference[index].nodeType == Node.ELEMENT_NODE) {
                (<HTMLElement>this.reference[index]).prepend(node);
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
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace first reference DOM element with another */
    replaceWith(node: Node) {
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
        } catch (ex) {
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
                        (<HTMLElement>ref).remove();
                    }
                    node._reference = [];
                }
                if (node.incubator.childNodes.length) {
                    for (let newnode of Array.from(node.incubator.childNodes)) {
                        node.flag.before(newnode)
                        node.reference.push(newnode);
                    }
                    return true;
                }
                return false;
            }, true);
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace reference node with a given html template*/
    replaceHtmlContent(new_content: string) {
        try {
            this.placeFlag((node) => {
                node.incubator.textContent = "";
                let content = [];
                let temp_node: ChildNode | null | undefined = Support.templateFromString(new_content).firstChild;
                do {
                    if (temp_node) {
                        let virtual = vNode.newInstance(temp_node, node);
                        virtual.setup();
                        virtual.elaborate();
                        content.push(virtual);
                    }
                    temp_node = temp_node?.nextSibling;
                }
                while (temp_node != null);

                for (const item of content) {
                    for (const child of item.reference) {
                        node.incubator.appendChild(child);
                    }
                }

                let _output = node.incubator.childNodes.length > 0;
                node.replaceNodes();
                return _output;
            }, true);
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Run elaboration afer inject node flag in dom */
    placeFlag(elaborate: (node: vNode) => boolean, bottom: boolean = false) {

        let _position = bottom ? this.reference.length - 1 : 0;

        if (this._reference.length > 0) (<HTMLElement>this.reference[_position]).after(this.flag);
        if (elaborate(this)) this.flag.remove();
    }
    hasAttribute(attribute: string) {
        return this.isElement ? this.element?.hasAttribute(attribute) : false;
    }
    //#endregion

    //#region CHILDREN
    /**Remove children based on filter, if filter is empty it remove all children */
    removeChildren(filter?: (item: vNode) => boolean): void {
        try {
            if (filter) {
                let _filtered = this._children.filter((e) => filter(e));
                for (const child of _filtered) {
                    child.dismiss();
                }
                this._children = _filtered;
            } else {
                this._children = [];
                if (this.reference && this.reference.length && this.reference[0].nodeType == Node.ELEMENT_NODE)
                    (<HTMLElement>this.reference[0]).innerHTML = "";
            }
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }
    /**Replace virtual child with another */
    replaceChild(vnode: vNode) {
        let _child = this._children.find((e) => e.id == this.id);
        if (_child) _child = vnode;
    }
    /**Store children nodes as virtual nodes */
    protected mapChildren(element: HTMLElement) {
        try {
            let _children = element.childNodes;
            for (const child of Array.from(_children)) {
                if (this.checkChild(child)) {
                    let _node = vNode.newInstance(child, this);
                    this.setupChildEvents(_node);
                    this.children.push(_node);
                }
            }

        } catch (ex) {
            throw ex;
        }
    }
    /**Check if child contains conditional rendering commands */
    protected checkChild(child: Node) {
        if (child.nodeType == Node.ELEMENT_NODE) return (<Element>child).getAttributeNames().find(a => a == cIf.key_else || a == cIf.key_elseif) == null
        if (child.nodeType == Node.TEXT_NODE) return child.nodeValue?.replace(/[\\n\s]*/g, "") != "";
        return true;
    }
    /**Setup children */
    protected async setupChildren() {
        let _setup: Promise<void>[] = [];
        for (const child of this.children) {
            _setup.push(child.setup());
        }
        return Promise.all(_setup);
    }
    /**Run first elaboration command to all children */
    protected async elaborateChildren() {
        let _elabs: Promise<void>[] = [];
        if (!this._commands.find((c) => c instanceof cFor)) { //exclude for because of auto elaboration of command
            for (const child of this.children) {
                _elabs.push(child.elaborate());
            }
        }
        return Promise.all(_elabs);
    }
    /**Update  node's children */
    protected async updateChildren() {
        let _updates: Promise<void>[] = [];
        for (const child of this.children) {
            _updates.push(child.update());
        }
        return Promise.all(_updates);
    }
    /**Setup default events on children */
    protected setupChildEvents(_node: vNode) {
        _node.onProgress((state) => {
            if (state == Collection.lifecycle.unmounted) {
                this._children = this._children.filter((c) => c.id != _node.id);
            }
        });
    }
    /**Check in original document if this element or its parents has one or more specified tag properties between class, nodeName and attributes */
    childOf(query: QueryElement): boolean {
        var isChild = (element: HTMLElement) => {
            return query.attribute ? element.hasAttribute(query.attribute) : false ||
                element.nodeName == query.nodeName ||
                query.class ? element.className.includes(query.class || "") : false;
        }
        return this.isElement && isChild(<HTMLElement>this.backup) ? true : (this.parent ? this.parent.childOf(query) : false);
    }

    //#endregion
}

/**vTemplate is the vDOM rappresentation of Components, it is an extension of vNode but with some semi-independant application features*/
export class vTemplate extends vNode {

    private template: string = ""; // component's html code
    private vtemplate_children: vNode[] = []; //component's vDOM children only
    private attributes: { name: string, prop: string, ref: string | null | undefined, dynamic: boolean | undefined }[] = [];; //component's paramters
    private dataset: {
        data?: DataCollection,
        actions?: DataCollection,
        computed?: DataCollection
    } = {};//base dataset for context

    constructor(reference: Node, template: string, options: TemplateOptions | undefined, parent?: vNode) {
        super(reference, parent);
        if (options && "settings" in options) this.updateSettings(<Settings>options?.settings);
        this.createTemplate(reference, template, options);
        this.load();
        this._handler.on(Collection.application_event.update, () => { this.update(); });
    }

    /**Prepare template data for processing */
    createTemplate(original: Node, template: string, options: TemplateOptions | undefined) {
        this.template = template;

        this.dataset = {
            data: options?.dataset,
            actions: options?.actions,
            computed: options?.computed
        }

        this.setupAttributes(options, original);
        this.setupEvents(options);

        this._incubator = this.getRender();
        if (!this.commandDriven)
            this.vtemplate_children = this.mapTemplatechildren(this.incubator);
    }

    /**Elaborate template's document fragment */
    private getRender(): DocumentFragment {
        return Support.templateFromString(this.template);
    }

    /**Elaborate complete template replacement */
    private load(): void {
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
                var element = <Node>_content.querySelector("[slot='" + _slot.getAttribute("name") + "']");
                if (element) {
                    (<HTMLElement>element).removeAttribute("slot");
                    (<Element>_slot).parentNode?.replaceChild(element, _slot);
                }
            }

            while (_content.childNodes.length) {
                this.incubator.firstChild?.appendChild(_content.childNodes[0]);
            }

            //Copying all extra custom tag's attributes on first render child node if it is a Node Element
            if (this.incubator.firstChild?.nodeType == Node.ELEMENT_NODE) {
                let _element = (<Element>this.incubator.firstChild);
                for (const attr of _attributes) {
                    _element.setAttribute(attr, (_element.hasAttribute(attr) ? _element.getAttribute(attr) + " " : "") + this.element?.getAttribute(attr));
                }
            }

            //this._handler.trigger(Collection.node_event.render, this.incubator, this);
            this.incubator.querySelectorAll("ref").forEach(e => e.remove());

            this.replaceNodes();
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }

    private setupEvents(options: TemplateOptions | undefined) {
        if (options?.events) {
            for (let event of options.events) {
                this._handler.on(event.name, event.action);
            }
        }
    }

    private setupAttributes(options: TemplateOptions | undefined, original: Node) {
        if (options?.inputs) {
            let _attributes = (<Element>original).getAttributeNames();
            for (const attr of options.inputs) {
                let _attribute = _attributes.find(a => a.includes(attr));

                if (_attribute != null) {
                    this.attributes.push({
                        name: _attribute,
                        prop: attr,
                        ref: this.element?.getAttribute(_attribute),
                        dynamic: this.element?.getAttribute(_attribute)?.match(Collection.regexp.brackets) != null || _attribute.includes(":")
                    });
                } else {
                    this.attributes.push({
                        name: "",
                        prop: attr,
                        ref: null,
                        dynamic: false
                    });
                }
            }
        }
    }

    async setup() {
        try {
            await super.setup();
        } catch (ex) {
            log(ex, Collection.message_type.error);
            this.state = Collection.lifecycle.error;
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
        } catch (ex) {
            log(ex, Collection.message_type.error);
        }
    }

    /**Like the application's relative method, it defines a unique data context,
     * but the passed variable's proxy is linked to the relative in the parent context instead of updating all vdom. */
    private async buildContext(): Promise<DataCollection> {
        this.state = Collection.lifecycle.context_creating;
        let _update: UpdateOptions | undefined;

        return Support.elaborateContext({}, this.dataset.data, { handler: this._handler, node: this, update: _update }, this.dataset.actions, this.dataset.computed)
            .then((output) => {
                output[Collection.KeyWords.node] = this;
                output[Collection.KeyWords.reference] = this.firstChild?.virtual?.firstChild;
                output[Collection.KeyWords.app] = this.application;

                for (const attr of this.attributes) {

                    if (!(attr.prop in output && attr.name == "")) {

                        let _options: ReactivityOptions = {
                            handler: this._handler,
                            node: this,
                            get: (_target: any, _key: string, _context?: DataCollection | undefined) => {
                                if (attr.ref) {
                                    return attr.dynamic ? elaborateContent(attr.ref, this.context) : attr.ref;
                                }
                                return Support.getValue(_target, _vault_key + "." + _key);
                            },
                            set: (_target: any, _key: any, newvalue: any) => {
                                if (attr.dynamic && attr.ref != null) {
                                    if (Reflect.get(this.context, attr.ref) !== newvalue) Support.setValue(this.context, attr.ref, newvalue);
                                } else {
                                    if (Reflect.get(_target, _key) !== newvalue) Support.setValue(_target, _vault_key + "." + _key, newvalue);
                                }

                            }
                        };

                        //output[attr.prop] = attr.ref;
                        ref(output, attr.prop, attr.ref, _options);
                        if (attr.name && this.reference.length > 0) (<Element>this.reference[0]).removeAttribute(attr.name);
                    }
                }
                return react(output, { handler: this._handler });
            }).then((context) => {
                this.state = Collection.lifecycle.context_created;
                return context
            });
    }

    protected async elaborateContext(context?: DataCollection | undefined): Promise<void> {
        await this.buildContext().then((template_context) => {
            this.context = context || this.parent?.context || template_context || {};
            this._handler.setContext(template_context);
            this._handler.trigger(Collection.node_event.dataset, template_context);
        });
    }

    /**Elaborate template's virtual nodes  */
    private mapTemplatechildren(render: DocumentFragment): vNode[] {
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

    protected async setupChildren(): Promise<void[]> {
        return super.setupChildren().then(() => {
            var _setup: Promise<void>[] = []
            //exclude for because of auto elaboration of command
            for (const child of this.vtemplate_children) {
                _setup.push(child.setup());
            }
            return Promise.all(_setup);
        });
    }
    /**Processes the children of the component using its personal context
     * and injected children with the inherited context  */
    protected async elaborateChildren(): Promise<void[]> {
        return super.elaborateChildren().then(() => {
            var _elabs: Promise<void>[] = []
            //exclude for because of auto elaboration of command
            if (!this._commands.find((c) => c instanceof cFor)) {
                for (const child of this.vtemplate_children) {
                    _elabs.push(child.elaborate(this._handler.Context || this.context));
                }
            }
            return Promise.all(_elabs);
        });
    }

    protected async updateChildren(): Promise<void[]> {
        return super.updateChildren().then(() => {
            var _elabs: Promise<void>[] = []
            //exclude for because of auto elaboration of command
            for (const child of this.vtemplate_children) {
                _elabs.push(child.update());
            }
            return Promise.all(_elabs);
        });
    }

    /**Update node settings and children settings in cascade*/
    updateSettings(settings: Settings | undefined) {

        if (settings != null) {
            super.updateSettings(settings);

            for (const child of this.vtemplate_children) {
                child.updateSettings(settings);
            }
        }
    }
}