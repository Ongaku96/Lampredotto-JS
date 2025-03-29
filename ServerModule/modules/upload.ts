import REST from "./REST.js";
import { RequestOptions, PartialWithRequired } from "./types.js";

export class UploadService extends REST {
    constructor(options: PartialWithRequired<RequestOptions, "url" | "data">) {
        super({ ...options, headers: { "Content-Type": options.data instanceof FormData ? "multipart/form-data" : "application/json", ...options.headers } });
    }
}
