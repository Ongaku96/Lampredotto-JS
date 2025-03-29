type ServiceType = "GET" | "POST" | "PUT" | "DELETE" | "UPLOAD" | "UPDATE" | "INSERT";
type HTTPOptions = {
    method?: ServiceType,
    body?: BodyInit,
    mode?: "no-cors" | "cors" | "same-origin",
    cache?: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached",
    credentials?: "include" | "same-origin" | "omit",
    headers?: HeadersInit,
    redirect?: "manual" | "follow" | "error",
    referrerPolicy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url",
    signal?: AbortSignal
}

type AbortRule = (ctrl: AbortController) => void

export interface iREST {
    options: HTTPOptions
    controller: AbortController
}

type RequestOptions = HTTPOptions & {
    url: string,
    data?: object | FormData,
    connectionTimer?: number,
    controller?: AbortController
}
type PartialWithRequired<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

export type { HTTPOptions, AbortRule, ServiceType, RequestOptions, PartialWithRequired }