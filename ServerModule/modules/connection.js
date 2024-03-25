import { default_timer } from "./references.js";
export default class ConnectionHandler {
    controller;
    rule;
    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }
    constructor(rule = (ctrl) => { setTimeout(() => { ctrl.abort(); }, default_timer); }) {
        this.controller = new AbortController();
        this.rule = rule;
    }
    run() {
        this.rule(this.controller);
    }
    clone() {
        return new ConnectionHandler(this.rule);
    }
}
