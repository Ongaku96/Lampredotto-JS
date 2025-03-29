import REST from "./REST.js";
export class UpdateService extends REST {
    constructor(options) {
        super({ ...options, method: "POST", headers: { "Content-Type": "multipart/form-data", ...options.headers } });
    }
}
