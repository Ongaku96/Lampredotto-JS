import "./global.js";
import { DataCollection, iEvent } from "./types.js";

/**Management of event collection*/
export default class EventHandler {

    private events?: iEvent<any>[] = [];
    private context: DataCollection | undefined;
    get Context(): DataCollection | undefined { return this.context; };

    constructor(dataset?: DataCollection) {
        if (dataset) this.setContext(dataset);
    }

    /**Store the event into the component, it will add the event event the name already exists*/
    on(event: string, action: (...args: any[]) => any | void): void {
        this.events?.push({ name: event, action: action });
    }
    /**Store the event into the component but it replace any with the same name */
    over(event: string, action: (...args: any[]) => any | void): void {
        this.events = this.events?.filter((s) => s.name != event);
        this.on(event, action);
    }
    /**Remove the specified named events */
    off(...names: string[]): void {
        for (let n in names) {
            this.events = this.events?.filter((s) => s.name != names[n]);
        }
    }
    /**Trigger the named event */
    trigger(name: string, ...args: any[]): void {
        try {
            let _event = this.events?.filter((e) => e.name == name);
            if (_event != null) {
                _event.forEach(e => this.context != null ? e.action.call(this.context, ...args) : e.action(...args));
            }
        } catch (ex) {
            throw ex;
        }
    }
    /**Check if the component contains that event */
    includeEvent(name: string): boolean {
        return this.events?.find((s) => s.name == name) != null;
    }

    setContext(dataset: DataCollection) {
        this.context = dataset;
    }
}