import { GetService } from "./get.js";
import { PostService } from "./post.js";
import { PutService } from "./put.js";
import { DeleteService } from "./delete.js";
import { UploadService } from "./upload.js";
import { UpdateService } from "./update.js";
import { InsertService } from "./insert.js";
export default class ServiceFactory {
    static instanceService(type, options) {
        let service;
        switch (type) {
            case "post":
                service = new PostService(options.url, options.data);
                break;
            case "put":
                service = new PutService(options.url, options.data);
                break;
            case "delete":
                service = new DeleteService(options.url);
                break;
            case "upload":
                service = new UploadService(options.url, options.data, options.method || "POST");
                break;
            case "update":
                service = new UpdateService(options.url, options.data);
                break;
            case "insert":
                service = new InsertService(options.url, options.data);
                break;
            default:
                service = new GetService(options.url);
                break;
        }
        if (options.controller != null)
            service.setAbortController(options.controller);
        if (options.connectionTimer != null)
            service.setConnectionTimeout(options.connectionTimer);
        return service;
    }
}
