import REST from "./REST.js";
export class DeleteService extends REST {
    constructor(options) {
        super({ ...options, method: "DELETE", headers: { "Content-Type": options.data instanceof FormData ? "multipart/form-data" : "application/json", ...options.headers } });
    }
}
