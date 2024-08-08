export default class ConnectionTimeoutInjector {
    controller;
    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }
    constructor(controller, timer) {
        this.controller = controller;
        setTimeout(() => { this.controller.abort(); }, timer);
    }
}
