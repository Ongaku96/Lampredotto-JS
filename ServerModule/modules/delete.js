import REST from "./REST.js";
export class DeleteService extends REST {
    constructor(url) {
        super(url, "DELETE");
    }
}
