import REST from "./REST.js";
export class InsertService extends REST {
    constructor(options) {
        super({ ...options, method: "PUT", headers: { "Content-Type": "multipart/form-data", ...options.headers } });
    }
}
