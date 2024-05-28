import REST from "./REST.js";
export class InsertService extends REST {
    constructor(url, data) {
        super(url, "PUT", data);
        this.options.headers = {
            "Content-Type": "multipart/form-data"
        };
    }
}
