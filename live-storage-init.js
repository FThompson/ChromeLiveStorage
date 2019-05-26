class LiveStorage {
    constructor(callback) {
        if (LiveStorage._instance) {
            callback(LiveStorage._instance._storage);
            return LiveStorage._instance;
        }
        this._listeners = {};
        this._storage = {
            sync: {},
            local: {}
        };
        this._updating = false;
        chrome.storage.sync.get(null, syncItems => {
            chrome.storage.local.get(null, localItems => {
                this._storage = {
                    sync: this._getStorageProxy('sync', syncItems),
                    local: this._getStorageProxy('local', localItems)
                };
                if (callback) {
                    callback(this._storage);
                }
                chrome.storage.onChanged.addListener(this._update);
            });
        });
        LiveStorage._instance = this;
    }

    static get instance() {
        return LiveStorage._instance;
    }

    static get sync() {
        return LiveStorage._instance.sync;
    }

    static get local() {
        return LiveStorage._instance.local;
    }

    get sync() {
        return this._storage.sync;
    }

    get local() {
        return this._storage.local;
    }

    addListener(key, callback) {
        if (!(key in this._listeners)) {
            this._listeners[key] = [];
        }
        this._listeners[key].push(callback);
    }

    removeListener(key, callback) {
        if (key in this._listeners) {
            this._listeners[key] = this._listeners[key].filter(lis => lis !== callback);
        }
    }

    _update(changes, areaName) {
        console.log('_update');
        console.log(areaName);
        console.log(changes);
        let added = {};
        let removed = [];
        Object.keys(changes).forEach(key => {
            if (key in this._listeners) {
                this._listeners[key].forEach(callback => callback(changes[key]));
            }
            if ('newValue' in changes[key]) {
                added[key] = changes[key].newValue;
            } else {
                removed.push(key);
            }
        });
        this._updating = true;
        Object.assign(this._storage[areaName], added);
        for (let key in removed) {
            delete this._storage[key];
        }
        this._updating = false;
    }

    _getStorageProxy(areaName, storage) {
        const handler = {
            set: (store, key, value) => {
                console.log('proxy.set');
                console.log(store);
                console.log(key + ' ' + value);
                if (this._updating) {
                    store[key] = value;
                } else {
                    chrome.storage[areaName].set({ [key]: value });
                }
                return true;
            },
            deleteProperty: (store, key) => {
                console.log('proxy.deleteProperty');
                console.log(store);
                console.log(key);
                if (this._updating) {
                    delete store[key];
                } else {
                    chrome.storage[areaName].remove(key);
                }
                return true;
            }
        };
        return new Proxy(storage, handler);
    }
}