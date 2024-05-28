import REST from "./REST.js";

export class PutService extends REST {

    constructor(url: string, data?: Object) {
        super(url, "PUT", JSON.stringify(data) ?? undefined);
    }
}
