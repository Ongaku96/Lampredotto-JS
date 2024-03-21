import { REST } from "./types";

export class PostService extends REST {

    constructor(url: string, data?: Object) {
        super(url, "POST", JSON.stringify(data) ?? undefined);
    }
}
