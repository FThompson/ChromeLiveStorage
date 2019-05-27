/**
 * This module defines a live storage object that maintains an up-to-date
 * representation of chrome.storage user data. 
 */
const LiveStorage = (() => {
    let updating = false; // flag to avoid infinite call stack when saving data
    const listeners = {};
    const storage = {
        sync: buildStorageProxy('sync'),
        local: buildStorageProxy('local'),
        managed: buildStorageProxy('managed')
    };

    /**
     * Adds a listener that calls a given callback when a given key's value
     * changes.
     * 
     * @param {String} key The key to listen for changes on.
     * @param {Function} callback The function to call when the key's value
     *                            changes.
     * @param {Object} options The optional options:
     *  * area {String} The name of the storage area to apply this listener to.
     *  * onLoad {Boolean} true to run when populating data in #load().
     */
    function addListener(key, callback, options={}) {
        if (!(key in listeners)) {
            listeners[key] = [];
        }
        listeners[key].push({ callback, options });
    }

    /**
     * Removes the given callback bound to a given key.
     * 
     * @param {String} key The key to remove the callback from.
     * @param {Function} callback The callback to remove.
     * @param {Object} options Optional options:
     *  * area {String} The storage area that the callback is bound to.
     */
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

    /**
     * Updates the local storage object and calls applicable listeners.
     * 
     * @param {Object} changes The changes to apply.
     * @param {String} areaName The name of the area to apply changes to.
     */
    function update(changes, areaName) {
        // identify changes
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
        // apply changes
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

    /**
     * Async loads data from chrome.storage and calls applicable callbacks.
     * 
     * @param {Object} areas The areas to load data into, where the keys are
     *                       area names and values are booleans.
     *                       Defaults to load sync/local, not load managed.
     */
    async function load(areas={}) {
        let defaults = { sync: true, local: true, managed: false };
        let requests = [];
        for (let area in defaults) {
            requests.push(new Promise((resolve, reject) => {
                let shouldFetch = area in areas ? areas[area] : defaults[area];
                if (shouldFetch) {
                    chrome.storage[area].get(null, items => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError.message);
                        }
                        resolve({ area, items });
                    });
                } else {
                    resolve({ area, items: {} });
                }
            }));
        }
        return Promise.all(requests).then(results => {
            // add loaded data into storage objects
            updating = true;
            for (let result of results) {
                Object.assign(storage[result.area], result.items);
            }
            updating = false;
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

    /**
     * Creates a storage data object proxy that calls chrome.storage functions
     * when modifying storage data. This proxy also enforces read-only access
     * for the "managed" chrome.storage area.
     * 
     * @param {String} areaName The area name of the wrapped storage object.
     */
    function buildStorageProxy(areaName) {
        return new Proxy({}, {
            set: (store, key, value) => {
                if (areaName === 'managed') {
                    throw new Error('chrome.storage.managed is read-only');
                }
                if (updating) {
                    store[key] = value;
                } else {
                    chrome.storage[areaName].set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) {
                            let info = {
                                action: 'set', area: areaName, key, value
                            };
                            onError(chrome.runtime.lastError.message, info);
                        }
                    });
                }
                return true;
            },
            deleteProperty: (store, key) => {
                if (areaName === 'managed') {
                    throw new Error('chrome.storage.managed is read-only');
                }
                if (updating) {
                    delete store[key];
                } else {
                    chrome.storage[areaName].remove(key, () => {
                        if (chrome.runtime.lastError) {
                            let info = {
                                action: 'remove', area: areaName, key
                            };
                            onError(chrome.runtime.lastError.message, info);
                        }
                    });
                }
                return true;
            }
        });
    }

    /**
     * Handles errors that occur in chrome.storage set/remove function calls.
     * This function should be defined to supply users with meaningful error
     * messages.
     * 
     * @param {String} message The message from `chrome.runtime.lastError`.
     * @param {Object} info Info containing the area, key, and value for which
     *                      the error occurred. Use these values to plan how to
     *                      avoid the error during future invocations.
     */
    function onError(message, info) {
        console.warn(message, info);
    }

    // the LiveStorage public contract, with unmodifiable storage objects
    // the explicit handleError getter/setter are required due to module scope
    return {
        load,
        addListener,
        removeListener,
        get sync() { return storage.sync; },
        get local() { return storage.local; },
        get managed() { return storage.managed; },
        get onError() { return onError },
        set onError(fn) { onError = fn }
    }
})();