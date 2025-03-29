import REST from "./REST.js";
import { PartialWithRequired, RequestOptions } from "./types.js";

export class PostService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url" | "data">) {
        super({ ...options, method: "POST", body: JSON.stringify(options.data) ?? undefined, headers: { "Content-Type": "application/json", ...options.headers } });
    }
}
