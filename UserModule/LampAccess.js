import { User } from "./modules/user.js";
import EventCollector from "./modules/events.js";
export default class UserHandler {
    session_key = "active_user";
    static _default = null;
    /**Singleton instance of user handler */
    static get instance() {
        if (this._default == null)
            this._default = new UserHandler();
        return this._default;
    }
    _events = new EventCollector(); //events collector
    _logged_user; //current user
    /**Get current user */
    get logged() { return this._logged_user != null; }
    /**Get current user stored data */
    get user() { return this._logged_user?.data; }
    /**Get current user stored settings */
    get settings() { return this._logged_user?.settings; }
    constructor() { }
    /**Login function store new user's data and settings in local storage altought it refresh existing user's data and save it in session storage and trigger login event*/
    login(id, data, settings) {
        try {
            if (!this.refreshUser(id, data)) {
                this._logged_user = new User(id, data, settings || {});
                this._logged_user?.save();
            }
            this.setSessionUser();
            this.triggerEvent("login");
        }
        catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }
    /**Logout function remove the user on session storage and trigger logout event */
    logout() {
        try {
            this._logged_user = undefined;
            this.removeSessionUser();
            this.triggerEvent("logout");
        }
        catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }
    /**
     * Register login event
     * @param action
     */
    onLogin(action) {
        this._events.registerEvent("login", action);
    }
    /**
     * Register logout event
     * @param action
     */
    onLogout(action) {
        this._events.registerEvent("logout", action);
    }
    /**
     * Register error event
     * @param action
     */
    onError(action) {
        this._events.registerEvent("error", action);
    }
    /**
     * Check if the user is already logged on Session Storage and retrive its data
     */
    sessionLogin() {
        this._logged_user = this.getSessionUser();
        if (this.logged)
            this.triggerEvent("login");
    }
    /**
     * Save user data on Local Storage
     */
    saveUser() {
        try {
            this._logged_user?.save();
        }
        catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }
    /**
     * Update user data from Local Storage
     * @param id
     * @param data
     * @returns
     */
    refreshUser(id, data) {
        try {
            this._logged_user = User.retrive(id, data);
            return this._logged_user != null;
        }
        catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
        return false;
    }
    async triggerEvent(name, ...args) {
        try {
            this._events.triggerEvent(name, ...args, this._logged_user);
        }
        catch (ex) {
            console.error("LAMP ACCESS: - " + name + " event trigger - " + ex);
        }
    }
    getSessionUser() {
        try {
            let _data = sessionStorage.getItem(this.session_key);
            if (_data) {
                let _user = JSON.parse(_data);
                return new User(_user.id, _user.data, _user.settings);
            }
            return undefined;
        }
        catch (ex) {
            throw ex;
        }
    }
    setSessionUser() {
        if (this._logged_user) {
            sessionStorage.setItem(this.session_key, this._logged_user?.stringify);
        }
    }
    removeSessionUser() {
        sessionStorage.removeItem(this.session_key);
    }
}
