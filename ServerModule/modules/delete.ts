import REST from "./REST.js";

export class DeleteService extends REST {

    constructor(url: string) {
        super(url, "DELETE");
    }
}
