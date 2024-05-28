import ConnectionHandler from "./connection.js";

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

export interface iREST {
    options: HTTPOptions
    connectionTimeout: ConnectionHandler
}

type ServiceType = "get" | "post" | "put" | "delete" | "upload" | "update" | "insert";
type Methods = "GET" | "POST" | "PUT" | "DELETE" | "GET"
type FactoryOptions = {
    url: string,
    data?: object | FormData,
    method?: Methods,
    connectionTimer?: number
}

export type { HTTPOptions, AbortRule, ServiceType, FactoryOptions, Methods }