import { exception, default_timer } from "./references.js";
import ConnectionTimeoutInjector from "./connection.js";
export default class REST {
    static timer = 30000;
    options = {
        url: "",
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", },
        redirect: "follow",
        policy: "no-referrer",
        data: undefined
    };
    get method() { return this.options.method; }
    get url() { return this.options.url; }
    get body() { return this.options.data; }
    controller = new AbortController();
    connectionTimer = default_timer;
    constructor(url, method, body) {
        this.options.url = url;
        this.options.method = method;
        this.options.data = body;
    }
    request() {
        let controller = new ConnectionTimeoutInjector(this.controller, this.connectionTimer);
        return fetch(this.options.url, {
            method: this.options.method || "GET",
            mode: this.options.mode || "cors",
            cache: this.options.cache || "no-cache",
            credentials: this.options.credentials || "same-origin",
            headers: this.options.headers || {
                "Content-Type": "application/json",
            },
            redirect: this.options.redirect || "follow",
            referrerPolicy: this.options.policy || "no-referrer",
            body: this.options.data,
            signal: controller.signal,
        }).then((response) => {
            controller.resetTimer();
            return response;
        });
    }
    setConnectionTimeout(timer) {
        this.connectionTimer = timer;
    }
    setAbortController(controller) {
        this.controller = controller;
    }
    async fetch() {
        return await this.request().then(async (response) => {
            if (!response.ok)
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
