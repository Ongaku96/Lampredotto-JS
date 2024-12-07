import { Collection } from "./enumerators.js";


export default function log(message: any, type: Collection.message_type = Collection.message_type.log) {
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