import ConnectionTimeoutInjector from "./modules/connection.js";
import { GetService } from "./modules/get.js";
import { default_timer } from "./modules/references.js";
import ServiceFactory from "./modules/serviceFactory.js";
import { RequestOptions, ServiceType } from "./modules/types.js";

export default class Service {

    private options: RequestOptions = {
        url: "",
        connectionTimer: default_timer,
        controller: new AbortController(),
    };

    //#region  SINGLETON
    private static _instance: Service | null = null;
    /**Get singleton instance of Server Service with 30s connection timeout rule by default*/
    static get instance() {
        if (this._instance == null) this._instance = new Service();
        return this._instance;
    }
    /**Instance new server service with personalized connection timeout rule */
    static Instance(options?: RequestOptions) {
        return new Service(options);
    }
    private constructor(options?: RequestOptions) {
        if (options) Object.assign(this.options, options);
    }
    //#endregion

    //#region REST API
    /**POST request with JSON data*/
    async post(url: string, data?: Object): Promise<Response> {
        return await ServiceFactory.instanceService("POST", { ...this.options, url: url, data: data }).fetch().catch((error) => { throw error; });
    }
    /**PUT request with JSON data*/
    async put(url: string, data?: Object): Promise<Response> {
        return await ServiceFactory.instanceService("PUT", { ...this.options, url: url, data: data }).fetch().catch((error) => { throw error; });
    }
    /**GET request */
    async get(url: string): Promise<Response> {
        return await ServiceFactory.instanceService("GET", { ...this.options, url: url }).fetch().catch((error) => { throw error; });
    }
    /**DELETE request */
    async delete(url: string): Promise<Response> {
        return await ServiceFactory.instanceService("DELETE", { ...this.options, url: url }).fetch().catch((error) => { throw error; });
    }
    /**POST or PUT request with Json or FormData*/
    async upload(url: string, data: any, request: Extract<ServiceType, "PUT" | "POST"> = "POST"): Promise<Response> {
        return await ServiceFactory.instanceService("UPLOAD", { ...this.options, url: url, data: data, method: request }).fetch().catch((error) => { throw error; });
    }
    /**POST request with FormData*/
    async update(url: string, data: FormData): Promise<Response> {
        return await ServiceFactory.instanceService("UPDATE", { ...this.options, url: url, data: data }).fetch().catch((error) => { throw error; });
    }
    /**PUT request with FormData*/
    async insert(url: string, data: FormData): Promise<Response> {
        return await ServiceFactory.instanceService("INSERT", { ...this.options, url: url, data: data }).fetch().catch((error) => { throw error; });
    }
    //#endregion

    //#region OTHERS
    /**Load server html into the first HTML Element that match the selector */
    async load(selector: string, url: string): Promise<void> {
        let _view = document.querySelector(selector);
        if (_view != null) {
            await this.getText(url).then(async (content) => {
                if (_view)
                    "virtual" in _view ? (<any>_view.virtual).replaceHtmlContent(content) : _view.outerHTML = content;
            }).catch((error) => { throw error; });
        } else {
            throw new Error("There was no element that match the selector " + selector);
        }
    }
    /**Generate an HTML element that run a script using src */
    async runScript(url: string, success_callback?: Function, error_callback?: Function) {
        let controller = new ConnectionTimeoutInjector(<AbortController>this.options.controller, this.options.connectionTimer ?? default_timer);
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
    //#endregion

    //#region GETTERS
    /**Elaborate url as GET request and return a json object response*/
    async getJson(url: string): Promise<object | undefined> {
        return await (<GetService>ServiceFactory.instanceService("GET", { ...this.options, url: url })).json().catch((error) => { throw error; });
    }
    /**Elaborate url as GET request and return a blob response*/
    async getBlob(url: string): Promise<Blob> {
        return await (<GetService>ServiceFactory.instanceService("GET", { ...this.options, url: url })).blob().catch((error) => { throw error; });
    }
    /**Elaborate url as GET request and return an Array Buffer response*/
    async getArrayBuffer(url: string): Promise<ArrayBuffer> {
        return await (<GetService>ServiceFactory.instanceService("GET", { ...this.options, url: url })).arrayBuffer().catch((error) => { throw error; });
    }
    /**Elaborate url as GET request and return text response */
    async getText(url: string): Promise<string> {
        return await (<GetService>ServiceFactory.instanceService("GET", { ...this.options, url: url })).text().catch((error) => { throw error; });
    }
    /**Elaborate url as GET request and return an ObjectUrl
     * *NOTES* Indicate for onscreen files preview
     */
    async getObjectUrl(url: string): Promise<string> {
        return await (<GetService>ServiceFactory.instanceService("GET", { ...this.options, url: url })).objectUrl().catch((error) => { throw error; });
    }
    //#endregion
}