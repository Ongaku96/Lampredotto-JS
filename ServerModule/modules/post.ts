import { REST } from "./types.js";

export class PostService extends REST {

    constructor(url: string, data?: Object) {
        super(url, "POST", JSON.stringify(data) ?? undefined);
    }
}
