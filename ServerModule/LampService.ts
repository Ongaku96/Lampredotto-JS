import ConnectionHandler from "./modules/connection.js";
import { GetService } from "./modules/get.js";
import { PostService } from "./modules/post.js";
import { default_timer } from "./modules/references.js";
import { UploadService } from "./modules/upload.js";

export default class Service {

    private connectionTimer: number = default_timer;
    //#region  SINGLETON
    private static _instance: Service | null = null;
    /**Get singleton instance of Server Service with 30s connection timeout rule by default*/
    static get instance() {
        if (this._instance == null) this._instance = new Service();
        return this._instance;
    }
    /**Instance new server service with personalized connection timeout rule */
    static Instance(connectionTimer?: number) {
        return new Service(connectionTimer);
    }
    private constructor(connectionTimer?: number) {
        if (connectionTimer != null) this.connectionTimer = connectionTimer;
    }
    //#endregion

    /**POST request with JSON data*/
    async post(url: string, data?: Object): Promise<Response> {
        return this.postInstance(url, data).fetch();
    }
    /**GET request */
    async get(url: string): Promise<Response> {
        return this.getInstance(url).fetch();
    }
    /**POST request with FormData*/
    async upload(url: string, data: FormData): Promise<Response> {
        return this.uploadInstance(url, data).fetch();
    }
    /**Load server html into the first HTML Element that match the selector */
    async load(selector: string, url: string): Promise<void> {
        let _view = document.querySelector(selector);
        if (_view != null) {
            this.getText(url).then(async (content) => {
                if (_view)
                    "virtual" in _view ? (<any>_view.virtual).replaceHtmlContent(content) : _view.outerHTML = content;
            }).catch((error) => { throw error; });
        } else {
            throw new Error("There was no element that match the selector " + selector);
        }
    }
    /**Generate an HTML element that run a script using src */
    async runScript(url: string, success_callback?: Function, error_callback?: Function) {
        let controller = new ConnectionHandler((ctrl) => { setTimeout(() => { ctrl.abort(); }, this.connectionTimer); });
        controller?.run();
        var script = createScript();
        var prior = document.getElementsByTagName('script')[0];
        prior.parentNode?.insertBefore(<Node>script, prior);

        function createScript() {

            var script: HTMLScriptElement | undefined = document.createElement('script');
            script.type = "text/javascript";
            script.src = url;
            script.async = true;

            const loader = (evt: Event) => {
                if (evt.target) {
                    if (controller?.aborted || !(<Document>evt.target).readyState || /loaded|complete/.test((<Document>evt.target).readyState)) {
                        script?.removeEventListener("load", loader);
                        script?.removeEventListener("readystatechange", loader);
                        script = undefined;
                        if (!controller?.aborted && error_callback) error_callback();
                    } else {
                        if (success_callback) success_callback();
                    }
                }
            };

            script.addEventListener("load", loader);
            script.addEventListener("readystatechange", loader);
            return script;
        }
    }

    async getJson(url: string): Promise<object | undefined> {
        return this.getInstance(url).json();
    }
    async getBlob(url: string): Promise<Blob> {
        return this.getInstance(url).blob();
    }
    async getArrayBuffer(url: string): Promise<ArrayBuffer> {
        return this.getInstance(url).arrayBuffer();
    }
    async getText(url: string): Promise<string> {
        return this.getInstance(url).text();
    }
    async getObjectUrl(url: string): Promise<string> {
        return this.getInstance(url).objectUrl();
    }


    private getInstance(url: string) {
        var service = new GetService(url);
        if (this.connectionTimer != null) service.setConnectionTimeout(this.connectionTimer);
        return service;
    }
    private postInstance(url: string, data?: object) {
        var service = new PostService(url, data);
        if (this.connectionTimer != null) service.setConnectionTimeout(this.connectionTimer);
        return service;
    }

    private uploadInstance(url: string, data: FormData) {
        var service = new UploadService(url, data);
        if (this.connectionTimer != null) service.setConnectionTimeout(this.connectionTimer);
        return service;
    }
}