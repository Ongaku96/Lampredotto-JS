export const error_header = "LAMP Service: ";
export const default_timer = 30000;
export function exception(target, response) {
    response.text().then(message => console.error(`${error_header}${target.method} -> ${message}`));
    return new Error(response.statusText, { cause: response });
}
/**Build url with search parameters created by dataset*/
export function buildUrl(base, data) {
    return base + "?" + new URLSearchParams(data).toString();
}
