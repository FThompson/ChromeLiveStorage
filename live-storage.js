const LiveStorage = (() => {
    let updating = false;
    const listeners = {};
    const storage = {
        sync: buildStorageProxy({}, 'sync'),
        local: buildStorageProxy({}, 'local'),
        managed: buildStorageProxy({}, 'managed')
    };

    // options:
    // * area: the name of the namespace for this key
    // * onLoad: true to run upon loading storage object
    function addListener(key, callback, options={}) {
        if (!(key in listeners)) {
            listeners[key] = [];
        }
        listeners[key].push({ callback, options });
    }

    function removeListener(key, callback, options) {
        if (key in listeners) {
            listeners[key] = listeners[key].filter(listener => {
                if (options.area && options.area !== listener.areaName) {
                    return false;
                }
                return listener.callback !== callback;
            });
        }
    }

    function update(changes, areaName) {
        let added = {};
        let removedKeys = [];
        for (let key in changes) {
            if ('newValue' in changes[key]) {
                added[key] = changes[key].newValue;
                changes[key].value = changes[key].newValue;
            } else {
                removedKeys.push(key);
            }
        }
        updating = true;
        Object.assign(storage[areaName], added);
        for (let key of removedKeys) {
            delete storage[areaName][key];
        }
        updating = false;
        // call listeners after updating storage objects
        for (let key in changes) {
            if (key in listeners) {
                callListeners(key, changes[key], areaName, false);
            }
        }
    }

    function callListeners(key, change, areaName, isLoad) {
        for (let listener of listeners[key]) {
            if (isLoad && !listener.options.onLoad) {
                continue;
            }
            if (listener.options.area && listener.options.area !== areaName) {
                continue;
            }
            listener.callback(change);
        }
    }

    async function load(storageAreas={}) {
        let defaults = { sync: true, local: true, managed: false };
        let requests = [];
        for (let area in defaults) {
            let shouldFetch = area in storageAreas ? storageAreas[area] : defaults[area];
            requests.push(new Promise((resolve, reject) => {
                if (shouldFetch) {
                    chrome.storage[area].get(null, items => {
                        resolve({ area, items });
                    });
                } else {
                    resolve({ area, items: {} });
                }
            }));
        }
        return Promise.all(requests).then(results => {
            for (let result of results) {
                storage[result.area] = buildStorageProxy(result.items, result.area);
            }
            // call listeners after updating storage objects
            for (let area in storage) {
                for (let key in storage[area]) {
                    if (key in listeners) {
                        let change = { value: storage[area][key] };
                        callListeners(key, change, area, true);
                    }
                }
            }
            chrome.storage.onChanged.addListener(update);
        });
    }

    function buildStorageProxy(storage, areaName) {
        const handler = {
            set: (store, key, value) => {
                if (areaName === 'managed') {
                    return false; // chrome.storage.managed is read-only
                }
                if (updating) {
                    store[key] = value;
                } else {
                    chrome.storage[areaName].set({ [key]: value })
                }
                return true;
            },
            deleteProperty: (store, key) => {
                if (areaName === 'managed') {
                    return false; // chrome.storage.managed is read-only
                }
                if (updating) {
                    delete store[key];
                } else {
                    chrome.storage[areaName].remove(key);
                }
                return true;
            }
        };
        return new Proxy(storage, handler);
    }

    return {
        load,
        addListener,
        removeListener,
        get sync() { return storage.sync; },
        get local() { return storage.local; },
        get managed() { return storage.managed; }
    }
})();