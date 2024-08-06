import REST from "./REST.js";

export const error_header: string = "LAMP Service: ";
export const default_timer: number = 30000;

export function exception(target: REST, response: Response) {
    response.text().then(message => console.error(`${error_header}${target.method} -> ${message}`));
    return new Error(response.statusText, { cause: response });
}

/**Build url with search parameters created by dataset*/
export function buildUrl(base: string, data: string | URLSearchParams | Record<string, string> | string[][] | undefined) {
    return base + "?" + new URLSearchParams(data).toString();
}