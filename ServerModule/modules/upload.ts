import REST from "./REST.js";
import { Methods } from "./types.js";

export class UploadService extends REST {
    constructor(url: string, data: any, method: Partial<Methods>) {
        super(url, method, data);
        this.options.headers = {
            "Content-Type": data instanceof FormData ? "multipart/form-data" : "application-json"
        };
    }
}
