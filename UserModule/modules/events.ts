type EventCallback = (...args: any[]) => void;

export default class EventCollector {
    private events: Record<string, EventCallback[]> = {};

    // Register an event with multiple callbacks
    registerEvent(eventName: string, callback: EventCallback): void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    // Trigger all callbacks associated with an event
    triggerEvent(eventName: string, ...args: any[]): void {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(...args));
        } else {
            console.log(`Event "${eventName}" not found.`);
        }
    }

    // Remove a specific callback from an event
    removeEvent(eventName: string, callback: EventCallback): void {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
            if (this.events[eventName].length === 0) {
                delete this.events[eventName]; // Remove event if no callbacks remain
            }
        }
    }
}