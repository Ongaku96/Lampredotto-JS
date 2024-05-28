import ConnectionHandler from "./modules/connection.js";
import { default_timer } from "./modules/references.js";
import ServiceFactory from "./modules/serviceFactory.js";
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
    //#region REST API
    /**POST request with JSON data*/
    async post(url, data) {
        return ServiceFactory.instanceService("post", { url: url, data: data }).fetch();
    }
    /**PUT request with JSON data*/
    async put(url, data) {
        return ServiceFactory.instanceService("put", { url: url, data: data }).fetch();
    }
    /**GET request */
    async get(url) {
        return ServiceFactory.instanceService("get", { url: url }).fetch();
    }
    /**DELETE request */
    async delete(url) {
        return ServiceFactory.instanceService("delete", { url: url }).fetch();
    }
    /**POST or PUT request with Json or FormData*/
    async upload(url, data, request = "POST") {
        return ServiceFactory.instanceService("upload", { url: url, data: data, method: request }).fetch();
    }
    /**POST request with FormData*/
    async update(url, data) {
        return ServiceFactory.instanceService("update", { url: url, data: data }).fetch();
    }
    /**PUT request with FormData*/
    async insert(url, data) {
        return ServiceFactory.instanceService("insert", { url: url, data: data }).fetch();
    }
    //#endregion
    //#region OTHERS
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
    //#endregion
    //#region GETTERS
    /**Elaborate url as GET request and return a json object response*/
    async getJson(url) {
        return ServiceFactory.instanceService("get", { url: url }).json();
    }
    /**Elaborate url as GET request and return a blob response*/
    async getBlob(url) {
        return ServiceFactory.instanceService("get", { url: url }).blob();
    }
    /**Elaborate url as GET request and return an Array Buffer response*/
    async getArrayBuffer(url) {
        return ServiceFactory.instanceService("get", { url: url }).arrayBuffer();
    }
    /**Elaborate url as GET request and return text response */
    async getText(url) {
        return ServiceFactory.instanceService("get", { url: url }).text();
    }
    /**Elaborate url as GET request and return an ObjectUrl
     * *NOTES* Indicate for onscreen files preview
     */
    async getObjectUrl(url) {
        return ServiceFactory.instanceService("get", { url: url }).objectUrl();
    }
}
