import "./global.js";
/**Management of event collection*/
export default class EventHandler {
    events = [];
    constructor() { }
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
    async trigger(name, ...args) {
        try {
            let _event = this.events?.find((e) => e.name == name);
            if (_event != null) {
                return _event.action(...args);
            }
            //console.warn(`The event named ${name} was not found.`);
            return null;
        }
        catch (ex) {
            throw ex;
        }
    }
    /**Check if the component contains that event */
    includeEvent(name) {
        return this.events?.find((s) => s.name == name) != null;
    }
}
