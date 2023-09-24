export class User {
    _settings = {};
    _data;
    _history = [];
    _id = "lamp_user";
    state = "active";
    get settings() { return this._settings; }
    get data() { return this._data; }
    get history() { return this._history; }
    get id() { return this._id; }
    get stringify() {
        let _json = {
            id: this.id,
            data: this.data,
            history: this.history,
            settings: this.settings,
            state: this.state,
        };
        return JSON.stringify(_json);
    }
    constructor(id, data, settings) {
        this._id = id;
        this._data = data;
        this._settings = settings || {};
    }
    save() {
        try {
            let _storage = {
                history: this.history,
                settings: this.settings
            };
            localStorage.setItem(this.id, JSON.stringify(_storage));
        }
        catch (ex) {
            throw ex;
        }
    }
    static retrive(id, data) {
        try {
            let _storage = localStorage.getItem(id);
            if (_storage) {
                let _obj = JSON.parse(_storage);
                let _user = new User(id, data, _obj.settings);
                _user._history = _obj.history;
                return _user;
            }
            return undefined;
        }
        catch (ex) {
            throw ex;
        }
    }
}
