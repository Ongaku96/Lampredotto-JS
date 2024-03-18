//This file collect all useful enumerators used in framework

import { Command, cBind, cFor, cIf, cModel, cOn } from "./commands.js";

//#region ENUMERATORS

/**Collection of library's enumerators */
export namespace Collection {

    export enum action_type {
        code = "code",
        link = "link",
        server = "server",
        email = "email",
        function = "function"
    }

    export enum message_type {
        log,
        success,
        warning,
        error,
        server_log,
        server_error,
        server_success,
        debug
    }

    export enum lifecycle {
        initialized = "initialized",
        setup = "setup",
        creating = "creating",
        created = "created",
        mounting = "mounting",
        mounted = "mounted",
        updating = "updating",
        updated = "updated",
        unmounting = "unmounting",
        unmounted = "unmounted",
        error = "error",
        server = "server",
        context_creating = "context_creating",
        context_created = "context_created",
        ready = "ready"
    }

    export enum command {
        model,
        for,
        on,
        name,
        if,
        else,
        elseif,
        filter,
        sort,
        bind,
        template
    }

    export enum trigger {
        click,
        load,
        change,
        submit,
        edit,
        hover,
        virtualized
    }

    export enum custom_event {
        update = "lp_pdate",
        abort = "lp_abort"
    }

    export enum error {
        /**The server cannot or will not process the request due to an apparent client error */
        badrequest = "#400",
        /**Authentication is required and has failed or has not yet been provided */
        unauthorized = "#401",
        paymentrequest = "#402",
        /**The request contained valid data and was understood by the server, but the server is refusing action */
        forbidden = "#403",
        /**The requested resource could not be found but may be available in the future */
        notfound = "#404",
        /**A request method is not supported for the requested resource */
        methodnotallowed = "#405",
        /**The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request */
        notacceptable = "#406",
        /**The client must first authenticate itself with the proxy. */
        proxyauthenticationrequired = "#407",
        /**The server timed out waiting for the request */
        requesttimeout = "#408",
        /**Indicates that the request could not be processed because of conflict in the current state of the resource */
        conflict = "#409",
        /**Indicates that the resource requested was previously in use but is no longer available and will not be available again */
        gone = "#410"
    }

    export enum node_event {
        /**Triggered on node's state progression */
        progress = "progress",
        /**Triggered on node's context change */
        change = "change",
        /**Triggered on node setup */
        setup = "setup",
        /**Triggered when the node is rendered */
        render = "render",
        /**Triggered when an html code is injected inside the node */
        inject = "inject",
        /**Triggered when element is being virtualized */
        virtualized = "virtualized",
        /**Triggered when Template context is elaborated */
        dataset = "dataset"
    }

    export enum application_event {
        /**Triggered on application's state progression */
        progress = "progress",
        /**Triggered on application's context change */
        update = "update",
        /**Triggered on application setup */
        setup = "setup",
        /**Triggered on application render */
        render = "render",
        /**Triggered when a new component is loaded*/
        component = "component"
    }

    export enum debug_mode {
        all = "all",
        message = "messages",
        command = "commands"
    }

    export class regexp {
        /**match all integer and decimal values */
        static numeric: RegExp = /^(([0-9]*)|(([0-9]*)[\.\,]([0-9]*)))$/g;
        /**match all textual values */
        static textual: RegExp = /\d/;
        /**match email format */
        static mail: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;
        /**match multiple email format */
        static multiplemail: RegExp = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-\.]+)+([;]([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-\.]+))*$/g;
        /**match date format */
        static date: RegExp = /(^(\d{2}|\d{1})[\/|\-|\.]+(\d{2}|\d{1})[\/|\-|\.]+\d{4})|(^(\d{4}[\/|\-|\.]+\d{2}|\d{1})[\/|\-|\.]+(\d{2}|\d{1}))$/g;
        static dateformat: RegExp = /([0][1-9]|[1][0-9]|[2][0-9]|[3][0-1])[/|.|-|,|;]([0][1-9]|[1][0-2])[/|.|-|,|;](([1][9][0-9]{2}|[2][0-9]{3})|(\d{2}))/g;
        /**Check if string conteins brackets */
        static reference: RegExp = /{{[\s]?[a-zA-Z0-9._]+[\s]?}}/g;
        /**match in tag script reference */
        static brackets: RegExp = /(?=\{\{)(.*?)(?<=\}\})/g;
        /**match property path into script references */
        static appdata: RegExp = /(?:\$\.[a-zA-Z_$]+[\w$]*)(?:\.[a-zA-Z_$]+[\w$]*)*/g;
        /**match function path into script references */
        static appfunction: RegExp = /(?:\&\.[a-zA-Z_$]+[\w$]*)(?:\.[a-zA-Z_$]+[\w$]*)*/g;
    }

    export class filesize {
        static byte: {
            name: "Bytes",
            size: 8,
        };
        static kilobyte: {
            name: "KB",
            size: 8192,
        };
        static megabyte: {
            name: "MB",
            size: 8e6,
        };
        static gigabyte: {
            name: "GB",
            size: 8e9,
        };
    }

    export const KeyWords = {
        node: "__node",
        app: "__app",
        reference: "__element"
    }
}

/**Collection of the framework errors with details*/
export const errors_mapper = new Map([
    ["EX1", "No application with the name {0} has been found"],
    ["EX2", "Cannot cook item {0}. Cooking instruction not found."],
    ["EX3", "Server connection timeout for the component {0}"],
    ["EX4", "The Spice {0} ran into a problem while running: {1}"],
    ["EX5", "An error occurred in the conversion of the json to Spice: {0}"],
    ["EX6", "Impossible to load the framework: {0}"],
    ["EX7", "An error occurred while the application setup: {0}"],
    ["EX8", "An error occurred while the application rendering: {0}"],
    ["EX9", "An error occurred on template setup process: {0}"],
]);
//#endregion

//#region REFERENCES
/**Map of supported events */
export const events_mapper = new Map([
    [Collection.trigger.click, "click"],
    [Collection.trigger.change, "change"],
    [Collection.trigger.load, "load"],
    [Collection.trigger.submit, "submit"],
    [Collection.trigger.edit, "change textInput input keyup"],
    [Collection.trigger.hover, "hover"],
    [Collection.trigger.virtualized, "virtualized"],
]);
const prefix = "cmd-";
/**Map of framework's html references */
export const commands_attributes = new Map([
    [Collection.command.model, prefix + "model"],
    [Collection.command.for, prefix + "for"],
    [Collection.command.on, prefix + "on"],
    [Collection.command.name, prefix + "name"],
    [Collection.command.if, prefix + "if"],
    [Collection.command.elseif, prefix + "elseif"],
    [Collection.command.else, prefix + "else"],
    [Collection.command.filter, prefix + "filter"],
    [Collection.command.sort, prefix + "sort"],
    [Collection.command.bind, prefix + "bind"],
    [Collection.command.template, prefix + "template"]
]);

export const command_matches: { key: RegExp, value: Command }[] = [
    { key: cModel.regexp, value: new cModel() },
    { key: cFor.regexp, value: new cFor() },
    { key: cOn.regexp, value: new cOn() },
    { key: cIf.regexp, value: new cIf() },
    { key: cBind.regexp, value: new cBind() },
];
//#endregion