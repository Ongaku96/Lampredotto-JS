export const error_header = "LAMP Service: ";
export const default_timer = 30000;
export function exception(target, response) {
    return new Error(`${error_header}${target.method}.${response.statusText}`);
}
/**Build url with search parameters created by dataset*/
export function buildUrl(base, data) {
    return base + "?" + new URLSearchParams(data).toString();
}
