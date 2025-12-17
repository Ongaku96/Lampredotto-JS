import { exception, default_timer } from "./references.js";
import ConnectionTimeoutInjector from "./connection.js";
export default class REST {
    static timer = 30000;
    options;
    get method() { return this.options.method; }
    get url() { return this.options.url; }
    get body() { return this.options.body ?? this.options.data; }
    controller = new AbortController();
    connectionTimeout = default_timer;
    constructor(options) {
        this.options = {
            ...options,
            method: options.method || "GET",
            mode: options.mode || "cors",
            cache: options.cache || "no-cache",
            credentials: options.credentials || "same-origin",
            headers: options.headers || {
                "Content-Type": "application/json",
            },
            redirect: options.redirect || "follow",
            referrerPolicy: options.referrerPolicy || "no-referrer",
            body: options.body,
            signal: options.controller?.signal,
        };
    }
    request() {
        let controller = new ConnectionTimeoutInjector(this.controller, this.connectionTimeout);
        return fetch(this.options.url, { ...this.options, body: this.body })
            .catch(ex => { console.error(ex); return ex; })
            .finally(() => { controller.resetTimer(); });
    }
    setConnectionTimeout(timer) {
        this.connectionTimeout = timer;
    }
    setAbortController(controller) {
        this.controller = controller;
    }
    async fetch() {
        return await this.request().then(async (response) => {
            if (!response?.ok)
                throw await exception(this, response);
            return response;
        });
    }
    setOptions(options) {
        this.options = options;
    }
    setHeaders(headers) {
        this.options.headers = headers;
    }
}
