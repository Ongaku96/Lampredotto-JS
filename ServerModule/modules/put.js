import REST from "./REST.js";
export class PutService extends REST {
    constructor(url, data) {
        super(url, "PUT", JSON.stringify(data) ?? undefined);
    }
}
