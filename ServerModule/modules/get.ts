import { exception } from "./references.js";
import { REST } from "./types.js";

export class GetService extends REST {

    constructor(url: string) {
        super(url, "GET");
    }

    override async fetch() {
        return await this.request().then((response) => {
            if (!response.ok) throw exception(this, response);
            return response;
        });
    }

    async json(): Promise<object> {
        return this.fetch().then((response) => {
            return response.json();
        }).catch((error) => { throw error; });
    }
    async blob(): Promise<Blob> {
        return this.fetch().then((response) => {
            return response.blob();
        }).catch((error) => { throw error; });
    }
    async arrayBuffer(): Promise<ArrayBuffer> {
        return this.fetch().then((response) => {
            return response.arrayBuffer();
        }).catch((error) => { throw error; });
    }
    async text(): Promise<string> {
        return this.fetch().then((response) => {
            return response.text();
        }).catch((error) => { throw error; });
    }
    async objectUrl(): Promise<string> {
        return this.fetch().then((response) => {
            return response.blob().then((obj) => {
                return URL.createObjectURL(obj);
            }).catch((error) => { throw error; });
        }).catch((error) => { throw error; });
    }
}
