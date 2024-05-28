import REST from "./REST.js";
export class PostService extends REST {
    constructor(url, data) {
        super(url, "POST", JSON.stringify(data) ?? undefined);
    }
}
