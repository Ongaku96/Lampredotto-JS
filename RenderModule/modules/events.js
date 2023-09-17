import "./global.js";
/**Management of event collection*/
export default class EventHandler {
    events = [];
    context;
    constructor(dataset) {
        if (dataset)
            this.setContext(dataset);
    }
    /**Store the event into the component, it will add the event event the name already exists*/
    on(event, action) {
        this.events?.push({ name: event, action: action });
    }
    /**Store the event into the component but it replace any with the same name */
    over(event, action) {
        this.events = this.events?.filter((s) => s.name != event);
        this.on(event, action);
    }
    /**Remove the specified named events */
    off(...names) {
        for (let n in names) {
            this.events = this.events?.filter((s) => s.name != names[n]);
        }
    }
    /**Trigger the named event */
    trigger(name, ...args) {
        try {
            let _event = this.events?.filter((e) => e.name == name);
            if (_event != null) {
                _event.forEach(e => this.context != null ? e.action.call(this.context, ...args) : e.action(...args));
            }
        }
        catch (ex) {
            throw ex;
        }
    }
    /**Check if the component contains that event */
    includeEvent(name) {
        return this.events?.find((s) => s.name == name) != null;
    }
    setContext(dataset) {
        this.context = dataset;
    }
}
