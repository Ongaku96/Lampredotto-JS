export default class Storage {

    protected address: string;
    private controller: AbortController;

    constructor(path: string) {
        this.address = path;
        this.controller = new AbortController();
    }


    save(data: FormData, filename?: string): Promise<Response> {
        try {
            let _url = this.address;
            if (filename != null) _url += filename;

            return fetch(_url, {
                method: "POST",
                body: data
            });
        } catch (ex) {
            console.error("LAMP STORAGE: " + ex);
            return new Promise(() => { return Response.error(); });
        }
    }

    read(filename?: string): Promise<Response> {
        try {
            let _url = this.address;
            if (filename != null) _url += filename;
            return fetch(_url);
        } catch (ex) {
            console.error("LAMP STORAGE: " + ex);
            return new Promise(() => { return Response.error(); });
        }
    }

    abort() {
        try {
            this.controller.abort();
            console.log("Connection to " + this.address + " aborted");
        } catch (ex) {
            console.error("LAMP STORAGE: " + ex);
        }
    }
}