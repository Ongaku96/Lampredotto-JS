import { HTTPOptions, iREST, RequestOptions } from "./types.js";
import { exception, default_timer } from "./references.js";
import ConnectionTimeoutInjector from "./connection.js";

export default class REST implements iREST {
    static timer: number = 30000;
    options: RequestOptions;
    get method() { return this.options.method; }
    get url() { return this.options.url; }
    get body() { return this.options.data; }

    controller: AbortController = new AbortController();
    connectionTimer: number = default_timer;

    constructor(options: RequestOptions) {
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
        }
    }

    protected request() {
        let controller = new ConnectionTimeoutInjector(this.controller, this.connectionTimer);
        return fetch(this.options.url, this.options as HTTPOptions).then((response) => {
            controller.resetTimer();
            return response;
        });
    }

    setConnectionTimeout(timer: number): void {
        this.connectionTimer = timer;
    }

    setAbortController(controller: AbortController) {
        this.controller = controller;
    }

    async fetch() {
        return await this.request().then(async (response) => {
            if (!response.ok) throw await exception(this, response);
            return response;
        });
    }

    setOptions(options: RequestOptions) {
        this.options = options;
    }

    setHeaders(headers: Headers) {
        this.options.headers = headers;
    }
}