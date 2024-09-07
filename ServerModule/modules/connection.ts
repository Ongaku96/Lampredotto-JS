export default class ConnectionTimeoutInjector {
    private controller: AbortController;
    private timer: number;

    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }
    constructor(controller: AbortController, timer: number) {
        this.controller = controller;
        this.timer = setTimeout(() => { this.controller.abort("Connection Timeout"); }, timer);
    }

    resetTimer() {
        clearTimeout(this.timer);
    }
}

