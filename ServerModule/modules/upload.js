import REST from "./REST.js";
export class UploadService extends REST {
    constructor(options) {
        super({ ...options, headers: { "Content-Type": options.data instanceof FormData ? "multipart/form-data" : "application/json", ...options.headers } });
    }
}
