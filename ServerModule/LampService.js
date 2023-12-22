import "./modules/Abort.js";
import AbortHandler from "./modules/Abort.js";

export default class Service {
    _abort_controller;
    constructor(options) {
        if (options.timeout) this._abort_controller = new AbortHandler((controller) => { setTimeout(() => { controller.abort(); }, options.timeout) });
    }
    /**Return Fetch request to the server, return a fetch's Promise<Response>*/
    request = (url, options) => {
        try {
            let controller = this._abort_controller?.clone();
            if (controller) controller.run();
            return fetch(url, {
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
        } catch (ex) {
            console.error("LAMPServices Request: " + ex);
            throw ex;
        }
    };
    /**POST request with JSON data*/
    async post(url, data, success_callback, error_callback) {
        return this.request(url, {
            method: "POST",
            data: JSON.stringify(data)
        }).then((response) => {
            if (response.ok) {
                if (success_callback)
                    success_callback(response);
            }
            else {
                if (error_callback)
                    error_callback(response);
            }
            return response;
        }).catch((reason) => {
            console.error("LAMPServices POST: " + reason);
            return reason;
        });
    }
    /**GET request */
    async get(url, success_callback, error_callback) {
        return this.request(url, { method: "GET" })
            .then((response) => {
                if (response.ok) {
                    if (success_callback)
                        success_callback(response);
                }
                else {
                    if (error_callback)
                        error_callback(response);
                }
                return response;
            }).catch((reason) => {
                console.error("LAMPServices GET: " + reason);
                return reason;
            });
    }
    /**POST request with FormData*/
    async upload(url, data, success_callback, error_callback) {
        return this.request(url, {
            method: "POST",
            data: data,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }).then((response) => {
            if (response.ok) {
                if (success_callback)
                    success_callback(response.json());
            }
            else {
                if (error_callback)
                    error_callback(response);
            }
            return response;
        }).catch((reason) => {
            console.error("LAMPServices UPLOAD: " + reason);
            return reason;
        });
    }
    /**Load server html into the first HTML Element that match the selector */
    async load(selector, url, success_callback, error_callback) {
        try {
            let _view = document.querySelector(selector);
            if (_view != null) {
                return this.request(url).then(async (response) => {
                    if (response.ok) {
                        let _content = await response.json();
                        if (_view)
                            _view.innerHTML = _content;
                        if (success_callback)
                            success_callback(new Response(JSON.stringify(response)));
                    }
                    else {
                        if (error_callback)
                            error_callback(new Response(JSON.stringify(response), { status: 0, statusText: "An error occourred while loading view " + selector }));
                    }
                    return response;
                }).catch((reason) => {
                    console.error("LAMPServices LOAD: " + reason);
                    return reason;
                });
            }
            else {
                if (error_callback)
                    error_callback(new Response(JSON.stringify(selector), { status: 0, statusText: "There was no element that match the selector " + selector }));
                return null;
            }
        }
        catch (ex) {
            console.error("LAMPServices LOAD: " + ex);
            throw ex;
        }
    }
    /**Generate an HTML element that run a server linked script */
    async runScript(url, success_callback, error_callback) {
        try {
            let controller = this._abort_controller?.clone();
            controller?.run();
            var script = () => {
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
            };
            var prior = document.getElementsByTagName('script')[0];
            prior.parentNode?.insertBefore(script(), prior);
        } catch (ex) {
            console.error("LAMPServices SCRIPT: " + ex);
            throw ex;
        }
    }
    /**Build url with search parameters created by dataset*/
    static buildUrl(base, data) {
        return base + "?" + new URLSearchParams(data).toString();
    }
    static instance(abort) {
        return new Service(abort);
    }
}
