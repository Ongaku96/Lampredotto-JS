import { GetService } from "./get.js";
import { PostService } from "./post.js";
import { PutService } from "./put.js";
import { DeleteService } from "./delete.js";
import { UploadService } from "./upload.js";
import { UpdateService } from "./update.js";
import { InsertService } from "./insert.js";
import REST from "./REST.js";
import { PartialWithRequired, RequestOptions } from "./types.js";

export default class ServiceFactory {

    static instanceService(type: ServiceFactory, options: RequestOptions) {
        let service: REST;
        switch (type) {
            case "post": service = new PostService(<PartialWithRequired<RequestOptions, "url" | "data">>options); break;
            case "put": service = new PutService(<PartialWithRequired<RequestOptions, "url" | "data">>options); break;
            case "delete": service = new DeleteService(options); break;
            case "upload": service = new UploadService(<PartialWithRequired<RequestOptions, "url" | "data">>options); break; //, options.data, options.method || "POST"
            case "update": service = new UpdateService(<PartialWithRequired<RequestOptions, "url" | "data">>options); break; //.url, options.data
            case "insert": service = new InsertService(<PartialWithRequired<RequestOptions, "url" | "data">>options); break; //.url, options.data
            default: service = new GetService(options); break;
        }
        if (options.controller != null) service.setAbortController(options.controller);
        if (options.connectionTimer != null) service.setConnectionTimeout(options.connectionTimer);
        return service;
    }

}