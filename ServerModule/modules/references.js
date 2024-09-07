export const error_header = "LAMP Service: ";
export const default_timer = 30000;
export async function exception(target, response) {
    var error = {};
    try {
        error = await response.json();
    }
    catch (ex) {
        console.debug(ex);
    }
    return new Error(error.ExceptionMessage ?? response.statusText, {
        cause: {
            target: target.method,
            response: error,
            message: `${error_header}${target.method} -> ${error.ExceptionMessage ?? response.statusText}`
        }
    });
}
/**Build url with search parameters created by dataset*/
export function buildUrl(base, data) {
    return base + "?" + new URLSearchParams(data).toString();
}
