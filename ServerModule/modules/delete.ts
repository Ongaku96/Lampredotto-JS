import REST from "./REST.js";
import { RequestOptions, PartialWithRequired } from "./types.js";

export class DeleteService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url">) {
        super({ ...options, method: "DELETE", headers: { "Content-Type": options.data instanceof FormData ? "multipart/form-data" : "application/json", ...options.headers } });
    }
}
