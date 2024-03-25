import { REST } from "./types";
export class PostService extends REST {
    constructor(url, data) {
        super(url, "POST", JSON.stringify(data) ?? undefined);
    }
}
