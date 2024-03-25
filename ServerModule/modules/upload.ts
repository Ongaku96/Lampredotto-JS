import { REST } from "./types.js";

export class UploadService extends REST {

    constructor(url: string, data: FormData) {
        super(url, "PUT", data);
        this.options.headers = {
            "Content-Type": "multipart/form-data"
        };
    }
}
