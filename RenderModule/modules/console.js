import { Collection } from "./enumerators.js";
export function log(message, type = Collection.message_type.log) {
    switch (type) {
        case Collection.message_type.log:
            console.log("LAMP.log:", message);
            break;
        case Collection.message_type.success:
            console.info("LAMP.success:", message);
            break;
        case Collection.message_type.warning:
            console.warn("LAMP.warning:", message);
            break;
        case Collection.message_type.error:
            console.error("LAMP.error:", message);
            break;
        case Collection.message_type.server_log:
            console.log("LAMP.server log:", message);
            break;
        case Collection.message_type.server_error:
            console.error("LAMP.server error:", message);
            break;
        case Collection.message_type.server_success:
            console.info("LAMP.server success:", message);
            break;
        case Collection.message_type.debug:
            console.debug("LAMP.debug:", message);
            break;
    }
}
export default class Log {
    constructor() { }
    static writeLine(message) {
        log(message, Collection.message_type.log);
    }
    static error(message) {
        log(message, Collection.message_type.error);
    }
    static info(message) {
        log(message, Collection.message_type.info);
    }
    static serverSuccess(message) {
        log(message, Collection.message_type.server_success);
    }
    static serverError(message) {
        log(message, Collection.message_type.server_error);
    }
    static serverLog(message) {
        log(message, Collection.message_type.server_log);
    }
    static debug(message) {
        log(message, Collection.message_type.debug);
    }
    static success(message) {
        log(message, Collection.message_type.success);
    }
    static warning(message) {
        log(message, Collection.message_type.warning);
    }
}
