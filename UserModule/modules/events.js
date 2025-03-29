export default class EventCollector {
    events = {};
    // Register an event with multiple callbacks
    registerEvent(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    // Trigger all callbacks associated with an event
    triggerEvent(eventName, ...args) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(...args));
        }
        else {
            console.log(`Event "${eventName}" not found.`);
        }
    }
    // Remove a specific callback from an event
    removeEvent(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
            if (this.events[eventName].length === 0) {
                delete this.events[eventName]; // Remove event if no callbacks remain
            }
        }
    }
}
