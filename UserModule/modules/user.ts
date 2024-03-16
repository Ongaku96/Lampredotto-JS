import { history } from "./types";
export class User {

    private _settings: any = {};
    private _data: any;
    private _history: history[] = [];
    private _id: string = "lamp_user";
    public state: string = "active";

    public get settings() { return this._settings; }
    public get data() { return this._data; }
    public get history() { return this._history; }
    public get id() { return this._id; }
    get stringify(): string {
        let _json = {
            id: this.id,
            data: this.data,
            history: this.history,
            settings: this.settings,
            state: this.state,
        }
        return JSON.stringify(_json);
    }

    constructor(id: string, data: any, settings?: any) {
        this._id = id;
        this._data = data;
        this._settings = settings || {};
    }

    save() {
        try {
            let _storage = {
                history: this.history,
                settings: this.settings
            }
            localStorage.setItem(this.id, JSON.stringify(_storage));
        } catch (ex) {
            throw ex;
        }
    }

    static retrive(id: string, data: any): User | undefined {
        try {
            let _storage = localStorage.getItem(id);
            if (_storage) {
                let _obj = JSON.parse(_storage);
                let _user = new User(id, data, _obj.settings);
                _user._history = _obj.history;
                return _user;
            }
            return undefined;
        } catch (ex) {
            throw ex;
        }
    }

}