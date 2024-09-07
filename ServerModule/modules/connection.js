export default class ConnectionTimeoutInjector {
    controller;
    timer;
    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }
    constructor(controller, timer) {
        this.controller = controller;
        this.timer = setTimeout(() => { this.controller.abort("Connection Timeout"); }, timer);
    }
    resetTimer() {
        clearTimeout(this.timer);
    }
}
