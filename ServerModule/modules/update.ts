import REST from "./REST.js";
import { RequestOptions, PartialWithRequired } from "./types.js";

export class UpdateService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url" | "data">) {
        super({ ...options, method: "POST", headers: { "Content-Type": "multipart/form-data", ...options.headers } });
    }
}
