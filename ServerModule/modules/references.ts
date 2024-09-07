import REST from "./REST.js";

export const error_header: string = "LAMP Service: ";
export const default_timer: number = 30000;

export async function exception(target: REST, response: Response) {
    var error: any = {};
    try { error = await response.json(); } catch (ex) { console.debug(ex); }
    return new Error(error.ExceptionMessage ?? response.statusText, {
        cause: {
            target: target.method,
            response: error,
            message: `${error_header}${target.method} -> ${error.ExceptionMessage ?? response.statusText}`
        }
    });
}

/**Build url with search parameters created by dataset*/
export function buildUrl(base: string, data: string | URLSearchParams | Record<string, string> | string[][] | undefined) {
    return base + "?" + new URLSearchParams(data).toString();
}