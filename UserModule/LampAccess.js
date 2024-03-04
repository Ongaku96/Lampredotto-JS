import { User } from "./modules/user.js";
export default class UserHandler {
    session_key = "active_user";
    static _default = null;
    /**Singleton instance of user handler */
    static get instance() {
        if (this._default == null)
            this._default = new UserHandler();
        return this._default;
    }
    _events; //events collector
    _logged_user; //current user
    /**Get current user */
    get logged() { return this._logged_user != null; }
    /**Get current user stored data */
    get user() { return this._logged_user?.data; }
    /**Get current user stored settings */
    get settings() { return this._logged_user?.settings; }
    constructor() {
        this._events = [
            { name: "login" },
            { name: "logout" },
            { name: "error" }
        ];
    }
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
    /** */
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
    onLogin(action) {
        let _event = this._events.find(e => e.name == "login");
        if (_event)
            _event["action"] = action;
    }
    onLogout(action) {
        let _event = this._events.find(e => e.name == "logout");
        if (_event)
            _event["action"] = action;
    }
    onError(action) {
        let _event = this._events.find(e => e.name == "error");
        if (_event)
            _event["action"] = action;
    }
    sessionLogin() {
        this._logged_user = this.getSessionUser();
        if (this.logged)
            this.triggerEvent("login");
    }
    saveUser() {
        try {
            this._logged_user?.save();
        }
        catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }
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
    triggerEvent(name, arg) {
        try {
            let _event = this._events.find(e => e.name == name);
            if (_event && _event.action != null) {
                _event.action(arg == null ? this._logged_user : arg);
            }
        }
        catch (ex) {
            console.error("LAMP ACCESS: - " + name + " event trigger - " + ex);
        }
    }
    getSessionUser() {
        try {
            let _data = sessionStorage.getItem("active_user");
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
