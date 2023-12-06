export default class Connection {
    address;
    controller;
    constructor(path) {
        this.address = path;
        this.controller = new AbortController();
    }
    save(data, filename) {
        let _url = this.address;
        if (filename != null)
            _url += filename;
        return fetch(_url, {
            method: "POST",
            body: data
        });
    }
    read(filename) {
        let _url = this.address;
        if (filename != null)
            _url += filename;
        return fetch(_url);
    }
    abort() {
        this.controller.abort();
        console.log("Connection to " + this.address + " aborted");
    }
}
