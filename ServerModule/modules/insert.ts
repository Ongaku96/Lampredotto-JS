import REST from "./REST.js";

export class InsertService extends REST {
    constructor(url: string, data: any) {
        super(url, "PUT", data);
        this.options.headers = {
            "Content-Type": "multipart/form-data"
        };
    }
}
