import ConnectionHandler from "./connection.js";
import { exception } from "./references.js";

type HTTPOptions = {
    url: string,
    method?: string,
    data?: BodyInit,
    mode?: "no-cors" | "cors" | "same-origin",
    cache?: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached",
    credentials?: "include" | "same-origin" | "omit",
    headers?: HeadersInit,
    redirect?: "manual" | "follow" | "error",
    policy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url",
}

type AbortRule = (ctrl: AbortController) => void

interface iREST {
    options: HTTPOptions
    connectionTimeout: ConnectionHandler
}

abstract class REST implements iREST {
    static timer: number = 30000;
    options: HTTPOptions = {
        url: "",
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: { "Content-Type": "application-json", },
        redirect: "follow",
        policy: "no-referrer",
        data: undefined
    };
    get method() { return this.options.method; }
    get url() { return this.options.url; }
    get body() { return this.options.data; }

    connectionTimeout: ConnectionHandler = new ConnectionHandler((ctrl) => { setTimeout(() => { ctrl.abort(); }, REST.timer) });

    constructor(url: string, method: string, body: BodyInit | undefined = undefined) {
        this.options.url = url
        this.options.method = method;
        this.options.data = body;
    }

    protected request = () => {
        let controller = this.connectionTimeout?.clone();
        if (controller) controller.run();
        return fetch(this.options.url, {
            method: this.options.method || "GET",
            mode: this.options.mode || "cors",
            cache: this.options.cache || "no-cache",
            credentials: this.options.credentials || "same-origin",
            headers: this.options.headers || {
                "Content-Type": "application-json",
            },
            redirect: this.options.redirect || "follow",
            referrerPolicy: this.options.policy || "no-referrer",
            body: this.options.data,
            signal: controller?.signal,
        });
    }


    setConnectionTimeout(timer: number): void {
        this.connectionTimeout = new ConnectionHandler((ctrl) => { setTimeout(() => { ctrl.abort() }, timer); });
    }

    async fetch() {
        return await this.request().then((response) => {
            if (!response.ok) throw exception(this, response);
            return response;
        });
    }
}

export type { HTTPOptions, AbortRule }
export { REST }