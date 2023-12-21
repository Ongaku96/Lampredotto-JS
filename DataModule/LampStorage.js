export default class Storage {
    address;
    controller;
    constructor(path) {
        this.address = path;
        this.controller = new AbortController();
    }
    save(data, filename) {
        try {
            let _url = this.address;
            if (filename != null)
                _url += filename;
            return fetch(_url, {
                method: "POST",
                body: data
            });
        }
        catch (ex) {
            console.error("LAMP STORAGE: " + ex);
            return new Promise(() => { return Response.error(); });
        }
    }
    read(filename) {
        try {
            let _url = this.address;
            if (filename != null)
                _url += filename;
            return fetch(_url);
        }
        catch (ex) {
            console.error("LAMP STORAGE: " + ex);
            return new Promise(() => { return Response.error(); });
        }
    }
    abort() {
        try {
            this.controller.abort();
            console.log("Connection to " + this.address + " aborted");
        }
        catch (ex) {
            console.error("LAMP STORAGE: " + ex);
        }
    }
}
