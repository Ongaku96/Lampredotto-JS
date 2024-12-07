import { Support } from "./library.js";
/**
 * Utility Class for updating process optimization
 *
 * @export
 * @class TaskManager
 * @typedef {TaskManager}
 */
export default class TaskManager {
    tasks = [];
    constructor() { }
    /**Add waiting Task or replace the last */
    add(action) {
        let task = {
            id: Support.uniqueID(),
            running: false,
            action: action
        };
        this.tasks = this.tasks.filter(t => t.running); //remove all waiting tasks
        this.tasks.push(task); //add new task
        if (!this.checkRunningTask())
            this.run(); //if nothing is running run first task in pipeline
    }
    /**Clear pipeline */
    clear() {
        this.tasks = [];
    }
    /** get first waiting task*/
    getWaitingTask() {
        return this.tasks.length ? this.tasks.find(t => !t.running) : null;
    }
    /**run first waiting task and concatenate next waiting task in pipeline */
    run() {
        let task = this.getWaitingTask();
        if (task != null) {
            task.running = true;
            task.action().then(() => {
                this.removeTask(task?.id);
                this.run();
            });
        }
    }
    /**Remove task with specified id */
    removeTask(id) {
        if (id)
            this.tasks = this.tasks.filter(t => t.id !== id);
    }
    /**Check if there are running tasks */
    checkRunningTask() {
        return this.tasks.find(t => t.running) != null;
    }
}
