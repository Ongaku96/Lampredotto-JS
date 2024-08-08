export default class ConnectionTimeoutInjector {
    private controller: AbortController;

    get signal() { return this.controller.signal; }
    get aborted() { return this.controller.signal.aborted; }

    constructor(controller: AbortController, timer: number) {
        this.controller = controller;
        setTimeout(() => { this.controller.abort(); }, timer);
    }
}
