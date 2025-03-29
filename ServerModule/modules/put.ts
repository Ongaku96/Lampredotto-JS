import REST from "./REST.js";
import { PartialWithRequired, RequestOptions } from "./types.js";

export class PutService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url" | "data">) {
        super({ ...options, method: "PUT", body: JSON.stringify(options.data) ?? undefined, headers: { "Content-Type": "application/json", ...options.headers } });
    }
}
