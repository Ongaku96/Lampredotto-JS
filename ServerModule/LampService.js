import ConnectionHandler from "./modules/connection.js";
import { GetService } from "./modules/get.js";
import { PostService } from "./modules/post.js";
import { default_timer } from "./modules/references.js";
import { UploadService } from "./modules/upload.js";
export default class Service {
    connectionTimer = default_timer;
    //#region  SINGLETON
    static _instance = null;
    /**Get singleton instance of Server Service with 30s connection timeout rule by default*/
    static get instance() {
        if (this._instance == null)
            this._instance = new Service();
        return this._instance;
    }
    /**Instance new server service with personalized connection timeout rule */
    static Instance(connectionTimer) {
        return new Service(connectionTimer);
    }
    constructor(connectionTimer) {
        if (connectionTimer != null)
            this.connectionTimer = connectionTimer;
    }
    //#endregion
    /**POST request with JSON data*/
    async post(url, data) {
        return this.postInstance(url, data).fetch();
    }
    /**GET request */
    async get(url) {
        return this.getInstance(url).fetch();
    }
    /**POST request with FormData*/
    async upload(url, data) {
        return this.uploadInstance(url, data).fetch();
    }
    /**Load server html into the first HTML Element that match the selector */
    async load(selector, url) {
        let _view = document.querySelector(selector);
        if (_view != null) {
            this.getText(url).then(async (content) => {
                if (_view)
                    "virtual" in _view ? _view.virtual.replaceHtmlContent(content) : _view.outerHTML = content;
            }).catch((error) => { throw error; });
        }
        else {
            throw new Error("There was no element that match the selector " + selector);
        }
    }
    /**Generate an HTML element that run a script using src */
    async runScript(url, success_callback, error_callback) {
        let controller = new ConnectionHandler((ctrl) => { setTimeout(() => { ctrl.abort(); }, this.connectionTimer); });
        controller?.run();
        var script = createScript();
        var prior = document.getElementsByTagName('script')[0];
        prior.parentNode?.insertBefore(script, prior);
        function createScript() {
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.src = url;
            script.async = true;
            const loader = (evt) => {
                if (evt.target) {
                    if (controller?.aborted || !evt.target.readyState || /loaded|complete/.test(evt.target.readyState)) {
                        script?.removeEventListener("load", loader);
                        script?.removeEventListener("readystatechange", loader);
                        script = undefined;
                        if (!controller?.aborted && error_callback)
                            error_callback();
                    }
                    else {
                        if (success_callback)
                            success_callback();
                    }
                }
            };
            script.addEventListener("load", loader);
            script.addEventListener("readystatechange", loader);
            return script;
        }
    }
    /**Elaborate url as GET request and return a json object response*/
    async getJson(url) {
        return this.getInstance(url).json();
    }
    /**Elaborate url as GET request and return a blob response*/
    async getBlob(url) {
        return this.getInstance(url).blob();
    }
    /**Elaborate url as GET request and return an Array Buffer response*/
    async getArrayBuffer(url) {
        return this.getInstance(url).arrayBuffer();
    }
    /**Elaborate url as GET request and return text response */
    async getText(url) {
        return this.getInstance(url).text();
    }
    /**Elaborate url as GET request and return an ObjectUrl
     * *NOTES* Indicate for onscreen files preview
     */
    async getObjectUrl(url) {
        return this.getInstance(url).objectUrl();
    }
    getInstance(url) {
        var service = new GetService(url);
        if (this.connectionTimer != null)
            service.setConnectionTimeout(this.connectionTimer);
        return service;
    }
    postInstance(url, data) {
        var service = new PostService(url, data);
        if (this.connectionTimer != null)
            service.setConnectionTimeout(this.connectionTimer);
        return service;
    }
    uploadInstance(url, data) {
        var service = new UploadService(url, data);
        if (this.connectionTimer != null)
            service.setConnectionTimeout(this.connectionTimer);
        return service;
    }
}
