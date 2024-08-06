export const error_header = "LAMP Service: ";
export const default_timer = 30000;
export async function exception(target, response) {
    var error = await response.json();
    if (error && error.ExceptionMessage)
        console.error(`${error_header}${target.method} -> ${error.ExceptionMessage}`);
    return new Error(response.statusText, { cause: error });
}
/**Build url with search parameters created by dataset*/
export function buildUrl(base, data) {
    return base + "?" + new URLSearchParams(data).toString();
}
