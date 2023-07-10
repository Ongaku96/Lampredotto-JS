//This file collect all useful enumerators used in framework
import { cBind, cFor, cIf, cModel, cOn } from "./commands.js";
//#region ENUMERATORS
/**Collection of library's enumerators */
export var Collection;
(function (Collection) {
    let action_type;
    (function (action_type) {
        action_type[action_type["code"] = 0] = "code";
        action_type[action_type["link"] = 1] = "link";
        action_type[action_type["server"] = 2] = "server";
        action_type[action_type["email"] = 3] = "email";
        action_type[action_type["function"] = 4] = "function";
    })(action_type = Collection.action_type || (Collection.action_type = {}));
    let message_type;
    (function (message_type) {
        message_type[message_type["log"] = 0] = "log";
        message_type[message_type["success"] = 1] = "success";
        message_type[message_type["warning"] = 2] = "warning";
        message_type[message_type["error"] = 3] = "error";
        message_type[message_type["server_log"] = 4] = "server_log";
        message_type[message_type["server_error"] = 5] = "server_error";
        message_type[message_type["server_success"] = 6] = "server_success";
        message_type[message_type["debug"] = 7] = "debug";
    })(message_type = Collection.message_type || (Collection.message_type = {}));
    let lifecycle;
    (function (lifecycle) {
        lifecycle[lifecycle["initialized"] = 0] = "initialized";
        lifecycle[lifecycle["setup"] = 1] = "setup";
        lifecycle[lifecycle["creating"] = 2] = "creating";
        lifecycle[lifecycle["created"] = 3] = "created";
        lifecycle[lifecycle["mounting"] = 4] = "mounting";
        lifecycle[lifecycle["mounted"] = 5] = "mounted";
        lifecycle[lifecycle["updating"] = 6] = "updating";
        lifecycle[lifecycle["updated"] = 7] = "updated";
        lifecycle[lifecycle["unmounting"] = 8] = "unmounting";
        lifecycle[lifecycle["unmounted"] = 9] = "unmounted";
        lifecycle[lifecycle["error"] = 10] = "error";
        lifecycle[lifecycle["server"] = 11] = "server";
    })(lifecycle = Collection.lifecycle || (Collection.lifecycle = {}));
    let command;
    (function (command) {
        command[command["model"] = 0] = "model";
        command[command["for"] = 1] = "for";
        command[command["on"] = 2] = "on";
        command[command["name"] = 3] = "name";
        command[command["if"] = 4] = "if";
        command[command["else"] = 5] = "else";
        command[command["elseif"] = 6] = "elseif";
        command[command["filter"] = 7] = "filter";
        command[command["sort"] = 8] = "sort";
        command[command["bind"] = 9] = "bind";
        command[command["template"] = 10] = "template";
    })(command = Collection.command || (Collection.command = {}));
    let trigger;
    (function (trigger) {
        trigger[trigger["click"] = 0] = "click";
        trigger[trigger["load"] = 1] = "load";
        trigger[trigger["change"] = 2] = "change";
        trigger[trigger["submit"] = 3] = "submit";
        trigger[trigger["edit"] = 4] = "edit";
        trigger[trigger["hover"] = 5] = "hover";
        trigger[trigger["virtualized"] = 6] = "virtualized";
    })(trigger = Collection.trigger || (Collection.trigger = {}));
    let custom_event;
    (function (custom_event) {
        custom_event["update"] = "lp_pdate";
        custom_event["abort"] = "lp_abort";
    })(custom_event = Collection.custom_event || (Collection.custom_event = {}));
    let error;
    (function (error) {
        /**The server cannot or will not process the request due to an apparent client error */
        error["badrequest"] = "#400";
        /**Authentication is required and has failed or has not yet been provided */
        error["unauthorized"] = "#401";
        error["paymentrequest"] = "#402";
        /**The request contained valid data and was understood by the server, but the server is refusing action */
        error["forbidden"] = "#403";
        /**The requested resource could not be found but may be available in the future */
        error["notfound"] = "#404";
        /**A request method is not supported for the requested resource */
        error["methodnotallowed"] = "#405";
        /**The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request */
        error["notacceptable"] = "#406";
        /**The client must first authenticate itself with the proxy. */
        error["proxyauthenticationrequired"] = "#407";
        /**The server timed out waiting for the request */
        error["requesttimeout"] = "#408";
        /**Indicates that the request could not be processed because of conflict in the current state of the resource */
        error["conflict"] = "#409";
        /**Indicates that the resource requested was previously in use but is no longer available and will not be available again */
        error["gone"] = "#410";
    })(error = Collection.error || (Collection.error = {}));
    let node_event;
    (function (node_event) {
        /**Triggered on node's state progression */
        node_event["progress"] = "progress";
        /**Triggered on node's context change */
        node_event["change"] = "change";
        /**Triggered on node setup */
        node_event["setup"] = "setup";
        /**Triggered when the node is rendered */
        node_event["render"] = "render";
        /**Triggered when an html code is injected inside the node */
        node_event["inject"] = "inject";
        /**Triggered when element is being virtualized */
        node_event["virtualized"] = "virtualized";
        /**Triggered when Template context is elaborated */
        node_event["dataset"] = "dataset";
    })(node_event = Collection.node_event || (Collection.node_event = {}));
    let application_event;
    (function (application_event) {
        /**Triggered on application's state progression */
        application_event["progress"] = "progress";
        /**Triggered on application's context change */
        application_event["update"] = "update";
        /**Triggered on application setup */
        application_event["setup"] = "setup";
        /**Triggered on application render */
        application_event["render"] = "render";
    })(application_event = Collection.application_event || (Collection.application_event = {}));
    let debug_mode;
    (function (debug_mode) {
        debug_mode["all"] = "all";
        debug_mode["message"] = "messages";
        debug_mode["command"] = "commands";
    })(debug_mode = Collection.debug_mode || (Collection.debug_mode = {}));
    class regexp {
        /**match all integer and decimal values */
        static numeric = /^(([0-9]*)|(([0-9]*)[\.\,]([0-9]*)))$/g;
        /**match all textual values */
        static textual = /\d/;
        /**match email format */
        static mail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;
        /**match multiple email format */
        static multiplemail = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-\.]+)+([;]([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-\.]+))*$/g;
        /**match date format */
        static date = /(^(\d{2}|\d{1})[\/|\-|\.]+(\d{2}|\d{1})[\/|\-|\.]+\d{4})|(^(\d{4}[\/|\-|\.]+\d{2}|\d{1})[\/|\-|\.]+(\d{2}|\d{1}))$/g;
        static dateformat = /([0][1-9]|[1][0-9]|[2][0-9]|[3][0-1])[/|.|-|,|;]([0][1-9]|[1][0-2])[/|.|-|,|;](([1][9][0-9]{2}|[2][0-9]{3})|(\d{2}))/g;
        /**Check if string conteins brackets */
        static reference = /{{[\s]?[a-zA-Z0-9._]+[\s]?}}/g;
        /**match in tag script reference */
        static brackets = /(?=\{\{)(.*?)(?<=\}\})/g;
        /**match property path into script references */
        static appdata = /(?:\$\.[a-zA-Z_$]+[\w$]*)(?:\.[a-zA-Z_$]+[\w$]*)*/g;
        /**match function path into script references */
        static appfunction = /(?:\&\.[a-zA-Z_$]+[\w$]*)(?:\.[a-zA-Z_$]+[\w$]*)*/g;
    }
    Collection.regexp = regexp;
    class filesize {
        static byte;
        static kilobyte;
        static megabyte;
        static gigabyte;
    }
    Collection.filesize = filesize;
})(Collection || (Collection = {}));
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
export const command_matches = [
    { key: cModel.regexp, value: new cModel() },
    { key: cFor.regexp, value: new cFor() },
    { key: cOn.regexp, value: new cOn() },
    { key: cIf.regexp, value: new cIf() },
    { key: cBind.regexp, value: new cBind() },
];
//#endregion
