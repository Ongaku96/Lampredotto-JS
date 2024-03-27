import { default_timer } from "./references.js";

export default class ConnectionHandler {
    private controller: AbortController;
    private rule: (ctrl: AbortController) => void;

    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }

    constructor(rule: (ctrl: AbortController) => void = (ctrl) => { setTimeout(() => { ctrl.abort(); }, default_timer) }) {
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
