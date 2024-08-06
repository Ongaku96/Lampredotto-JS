import { User } from "./modules/user.js";

export default class UserHandler {

    private session_key: string = "active_user";
    private static _default: UserHandler | null = null;
    /**Singleton instance of user handler */
    public static get instance() {
        if (this._default == null) this._default = new UserHandler();
        return this._default;
    }

    private _events: { name: string, action?: (data: any) => void }[]; //events collector
    private _logged_user?: User; //current user
    /**Get current user */
    public get logged() { return this._logged_user != null; }
    /**Get current user stored data */
    public get user(): any { return this._logged_user?.data; }
    /**Get current user stored settings */
    public get settings(): any { return this._logged_user?.settings; }

    constructor() {
        this._events = [
            { name: "login" },
            { name: "logout" },
            { name: "error" }
        ]
    }
    /**Login function store new user's data and settings in local storage altought it refresh existing user's data and save it in session storage and trigger login event*/
    login(id: string, data: any, settings?: any) {
        try {
            if (!this.refreshUser(id, data)) {
                this._logged_user = new User(id, data, settings || {});
                this._logged_user?.save();
            }
            this.setSessionUser();
            this.triggerEvent("login");
        } catch (ex) {
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
        } catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }

    onLogin(action: (user: User) => void) {
        let _event = this._events.find(e => e.name == "login");
        if (_event) _event["action"] = action;
    }
    onLogout(action: (user: User) => void) {
        let _event = this._events.find(e => e.name == "logout");
        if (_event) _event["action"] = action;
    }
    onError(action: (error: any) => void) {
        let _event = this._events.find(e => e.name == "error");
        if (_event) _event["action"] = action;
    }

    sessionLogin() {
        this._logged_user = this.getSessionUser();
        if (this.logged) this.triggerEvent("login");
    }
    saveUser() {
        try {
            this._logged_user?.save();
        } catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
    }
    refreshUser(id: string, data: any): boolean {
        try {
            this._logged_user = User.retrive(id, data);
            return this._logged_user != null;
        } catch (ex) {
            this.triggerEvent("error", ex);
            console.log("LAMP ACCESS: " + ex);
        }
        return false;
    }

    private triggerEvent(name: string, arg?: any) {
        try {
            let _event = this._events.find(e => e.name == name);
            if (_event && _event.action != null) {
                _event.action(arg == null ? this._logged_user : arg);
            }
        } catch (ex) {
            console.error("LAMP ACCESS: - " + name + " event trigger - " + ex);
        }
    }
    private getSessionUser(): User | undefined {
        try {
            let _data = sessionStorage.getItem(this.session_key);
            if (_data) {
                let _user = JSON.parse(_data);
                return new User(_user.id, _user.data, _user.settings);
            }
            return undefined;
        } catch (ex) {
            throw ex;
        }
    }
    private setSessionUser(): void {
        if (this._logged_user) {
            sessionStorage.setItem(this.session_key, this._logged_user?.stringify);
        }
    }
    private removeSessionUser(): void {
        sessionStorage.removeItem(this.session_key);
    }
}