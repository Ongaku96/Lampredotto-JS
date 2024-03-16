import ConnectionHandler from "./modules/connection.js";
import { Options } from "./modules/types.js";

export default class Service {

    private connectionTimeout?: ConnectionHandler;

    private static _instance: Service | null = null;
    /**Get singleton instance of Server Service with 30s connection timeout rule by default*/
    static get instance() {
        if (this._instance == null) this._instance = new Service(new ConnectionHandler((ctrl) => { setTimeout(() => { ctrl.abort(); }, 30000) }));
        return this._instance;
    }
    /**Instance new server service with personalized connection timeout rule */
    static Instance(connectionTimeout?: ConnectionHandler) {
        return new Service(connectionTimeout);
    }

    private constructor(connectionAbortRule?: ConnectionHandler) {
        this.connectionTimeout = connectionAbortRule;
    }

    /**Return Fetch request to the server, return fetch async object*/
    public request = (options: Options) => {
        let controller = this.connectionTimeout?.clone();
        if (controller) controller.run();
        return fetch(options.url, {
            method: options.method || "GET",
            mode: options.mode || "cors",
            cache: options.cache || "no-cache",
            credentials: options.credentials || "same-origin",
            headers: options.headers || {
                "Content-Type": "application-json",
            },
            redirect: options.redirect || "follow",
            referrerPolicy: options.policy || "no-referrer",
            body: options.data,
            signal: controller?.signal,
        });
    }
    /**POST request with JSON data*/
    async post(url: string, data?: Object, success_callback?: Function, error_callback?: Function) {
        try {
            return this.request({
                url: url,
                method: "POST",
                data: JSON.stringify(data)
            }).then((response) => {
                if (response.ok) {
                    if (success_callback) success_callback(response);
                } else {
                    if (error_callback) error_callback(response);
                }
                return response;
            });
        } catch (ex) {
            console.error("LAMP Ajax: POST REQUEST - " + ex);
            throw ex;
        }
    }
    /**GET request */
    async get(url: string, success_callback?: Function, error_callback?: Function) {
        try {
            return this.request({
                url: url,
                method: "GET"
            }).then((response) => {
                if (response.ok) {
                    if (success_callback) success_callback(response);
                } else {
                    if (error_callback) error_callback(response);
                }
                return response;
            });
        } catch (ex) {
            console.error("LAMP Ajax: GET REQUEST - " + ex);
            throw ex;
        }
    }
    /**POST request with FormData*/
    async upload(url: string, data: FormData, success_callback: Function, error_callback?: Function) {
        try {
            return this.request({
                url: url,
                method: "POST",
                data: data,
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }).then((response) => {
                if (response.ok) {
                    if (success_callback) success_callback(response.json());
                } else {
                    if (error_callback) error_callback(response);
                }
                return response;
            });
        } catch (ex) {
            console.error("LAMP Ajax: PUT REQUEST - " + ex);
            throw ex;
        }
    }
    /**Load server html into the first HTML Element that match the selector */
    async load(selector: string, url: string, success_callback?: Function, error_callback?: Function) {
        try {
            let _view = document.querySelector(selector);
            if (_view != null) {
                return this.request({ url: url }).then(async (response) => {
                    if (response.ok) {
                        let _content = await response.json();
                        if (_view) "virtual" in _view ? (<any>_view.virtual).replaceHtmlContent(_content) : _view.outerHTML = _content;
                        if (success_callback)
                            success_callback(new Response(JSON.stringify(response)));
                    } else {
                        if (error_callback)
                            error_callback(new Response(JSON.stringify(response), { status: 0, statusText: "An error occourred while loading view " + selector }));
                    }
                    return response;
                });
            } else {
                if (error_callback)
                    error_callback(new Response(JSON.stringify(selector), { status: 0, statusText: "There was no element that match the selector " + selector }));
                return null;
            }
        } catch (ex) {
            console.error("LAMP Ajax: LOAD - " + ex);
            throw ex;
        }
    }
    /**Generate an HTML element that run a script using src */
    async runScript(url: string, success_callback?: Function, error_callback?: Function) {
        let controller = this.connectionTimeout?.clone();
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
    /**Build url with search parameters created by dataset*/
    static buildUrl(base: string, data: string | URLSearchParams | Record<string, string> | string[][] | undefined) {
        return base + "?" + new URLSearchParams(data).toString();
    }
}