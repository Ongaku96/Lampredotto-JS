import REST from "./REST.js";
import { PartialWithRequired, RequestOptions } from "./types.js";

export class InsertService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url" | "data">) {
        super({ ...options, method: "PUT", headers: { "Content-Type": "multipart/form-data", ...options.headers } });
    }
}
