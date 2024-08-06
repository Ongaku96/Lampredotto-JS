import REST from "./REST.js";

export const error_header: string = "LAMP Service: ";
export const default_timer: number = 30000;

export async function exception(target: REST, response: Response) {
    var error = await response.json();
    if (error && error.ExceptionMessage) console.error(`${error_header}${target.method} -> ${error.ExceptionMessage}`);
    return new Error(response.statusText, { cause: error });
}

/**Build url with search parameters created by dataset*/
export function buildUrl(base: string, data: string | URLSearchParams | Record<string, string> | string[][] | undefined) {
    return base + "?" + new URLSearchParams(data).toString();
}