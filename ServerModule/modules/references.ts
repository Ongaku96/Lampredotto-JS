import { REST } from "./types.js";

export const error_header: string = "LAMP Service: ";
export const default_timer: number = 30000;

export function exception(target: REST, response: Response) {
    return new Error(`${error_header}${target.method}.${response.statusText}`);
}

/**Build url with search parameters created by dataset*/
export function buildUrl(base: string, data: string | URLSearchParams | Record<string, string> | string[][] | undefined) {
    return base + "?" + new URLSearchParams(data).toString();
}