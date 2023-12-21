export default class AbortHandler {
    controller;
    rule;
    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }
    constructor(rule) {
        this.controller = new AbortController();
        this.rule = rule;
    }
    run() {
        this.rule(this.controller);
    }
    clone() {
        return new AbortHandler(this.rule);
    }
}
