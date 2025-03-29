import REST from "./REST.js";
export class PostService extends REST {
    constructor(options) {
        super({ ...options, method: "POST", body: JSON.stringify(options.data) ?? undefined, headers: { "Content-Type": "application/json", ...options.headers } });
    }
}
