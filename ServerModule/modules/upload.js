import { REST } from "./types.js";
export class UploadService extends REST {
    constructor(url, data) {
        super(url, "PUT", data);
        this.options.headers = {
            "Content-Type": "multipart/form-data"
        };
    }
}
