type Options = {
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

export type { Options }