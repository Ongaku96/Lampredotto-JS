import REST from "./REST.js";
export class UploadService extends REST {
    constructor(url, data, method) {
        super(url, method, data);
        this.options.headers = {
            "Content-Type": data instanceof FormData ? "multipart/form-data" : "application-json"
        };
    }
}
