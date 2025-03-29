import REST from "./REST.js";
export class PutService extends REST {
    constructor(options) {
        super({ ...options, method: "PUT", body: JSON.stringify(options.data) ?? undefined, headers: { "Content-Type": "application/json", ...options.headers } });
    }
}
