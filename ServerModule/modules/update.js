import REST from "./REST.js";
export class UpdateService extends REST {
    constructor(url, data) {
        super(url, "POST", data);
        this.options.headers = {
            "Content-Type": "multipart/form-data"
        };
    }
}
