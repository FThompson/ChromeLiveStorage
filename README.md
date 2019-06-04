# Chrome Extension Live Storage Object

Chrome Live Storage is a module that provides [`chrome.storage`](https://developer.chrome.com/apps/storage) data as native JavaScript objects that automatically synchronize between all extension views (background, content scripts, popups, options, etc.).

### Example

The following example demonstrates synchronizing a checkbox input with user data.

```javascript
const storage = LiveStorage;

// Load storage and update checkbox with loaded value from storage
storage.load().then(updateCheckbox);

// Update checkbox when data changes in storage
storage.addListener('myBooleanValue', updateCheckbox);

// Update storage when checkbox changes
document.getElementById('myCheckbox').addEventListener('change', function() {
    storage.sync.myBooleanValue = this.checked;
});

// Sets the checkbox value to the value in storage
function updateCheckbox() {
    document.getElementById('myCheckbox').checked = storage.sync.myBooleanValue;
}
```

### Sample Extension

This repository contains a sample Chrome extension that demonstrates synchronizing user data between the popup, the options page, the background script, and a content script which runs on this repository's GitHub page. You can choose to enable the repository page's background color from the popup/options pages and observe the change happen immediately.

## Installation

Download [live-storage.js](live-storage.js) to a location within your extension directory.

If you haven't already done so, declare the "storage" permission in your extension's manifest.

```
{
    ...
    "permissions": [
        "storage"
    ],
    ...
}
```

### Background Script

Declare live-storage.js in your manifest before the background script.

```
{
    ...
    "background": {
        "scripts": [
            "live-storage.js",
            "background.js"
        ]
    },
    ...
}
```

### Content Scripts

Declare live-storage.js in your manifest before the content script.

```
{
    ...
    "content_scripts": [
        {
            "matches": ...,
            "js": [
                "live-storage.js",
                "content.js"
            ]
        }
    ],
}
```

### Popup and Options Pages

Link live-storage.js through a `script` tag before the page script.

```html
<head>
    <script src='live-storage.js' defer></script>
    <script src='page.js' defer></script>
</head>
```

## Usage

You can use the storage object as `LiveStorage`, or declare it as any name you like, such as `storage`.

```javascript
const storage = LiveStorage;
```

This object contains storage objects that reflect each of the three `chrome.storage` areas. You can access these using `storage.sync`, `storage.local`, and `storage.managed`. The managed storage area is read-only.

### Load the storage object

The storage object starts out empty. Load existing `chrome.storage` data into the object with the async `load` function. The resulting promise resolves with no value but guarantees that the storage objects are populated.

```javascript
storage.load().then(() => {
    // Use values from storage.sync and storage.local to populate UI, etc.
    myCheckbox.checked = storage.sync.myBooleanValue;
});
```

If you try to access live storage before it has loaded, an error will be thrown.

### Make your app responsive to user data

Use `addListener` to define functions that are called when storage data changes. These listeners can make your extension responsive to storage changes made in other views (background, content, popup, options, etc.) and on other systems if you are using `sync` storage.

```javascript
storage.addListener('myBooleanValue', change => {
    myCheckbox.checked = change.value;
});
```

The `change` object passed to the callback can contain any of `oldValue`, `newValue`, and `value`. The `value` property will always contain the data's current value in storage. You can also access the storage directly, `storage.sync.myBooleanValue`.

By default, listeners added with this function will be run during the `load` function when populating the storage object. To disable that functionality, pass `onLoad: false` in the options object.

```javascript
storage.addListener('myBooleanValue', change => {
    myCheckbox.checked = change.value;
}, { onLoad: false });
```

You can restrict the listener to a specific storage area with the `area` option, for example `area: 'sync'`.

### Handle errors

In some situations, adding a value to storage can throw an error, such as if the storage is full or hitting its rate limit. Due to the async nature of the wrapped `chrome.storage` APIs, errors can occur after setting a value in your code. These errors are passed to an error handling callback that by default prints the error to the console as a warning.

To define your own error handling callback, set `storage.onError`. The callback function is passed a `message` parameter containing the browser API error message, and a `info` parameter containing the relevant action, storage area, data key, and data value.

```javascript
storage.onError = (message, info) => {
    console.warn(message, info);
    alert('Storage error: ' + message);
};
```

## API Reference

```javascript
LiveStorage
```

This module is exposed as a set of static properties and functions named `LiveStorage`.

```javascript
async LiveStorage.load([options])
```

Asynchronously loads user data from the `chrome.storage` areas, returning a promise that will either resolve without a value but with the storage values loaded, or reject with an error message. You can optionally pass an object indicating which areas to load, such as `{ areas: { sync: false, local: true, managed: false } }` to only load data from `chrome.storage.local`.

If live storage has already been loaded, `load()` returns immediately instead of reloading the storage objects.

```javascript
LiveStorage.sync
```

A live storage object reflecting user data stored in `chrome.storage.sync`.

```javascript
LiveStorage.local
```

A live storage object reflecting user data stored in `chrome.storage.local`.

```javascript
LiveStorage.managed
```

A live storage object reflecting enterprise data stored in `chrome.storage.managed`. Read-only.

```javascript
LiveStorage.addListener(key, callback[, options])
```

Adds a listener that calls the given callback when the given key's value changes. You can optionally pass an options object containing any of the following:
 * `area` The name of the storage area to restrict this listener to, such as `"sync"`.
 * `onLoad` Whether or not to run this listener during `LiveStorage.load()`. Pass `true` to run on load. Default `true`.

```javascript
LiveStorage.removeListener(key, callback[, options])
```

Removes the given callback from the given key. If the listener was defined with the `area` option, you must pass the same `area` value in the optional options object.

```javascript
LiveStorage.onError
```

The error handler that will be called if any internal `chrome.storage` API errors occur while setting or removing storage data, such as due to exceeding storage size quotas or rate limits. You can define this function to override the default `console.warn` behavior. This callback is passed the error message as `message` and the context information in the `info` object, containing information such as action, storage area name, data key, and data value.

```javascript
LiveStorage.loaded
```

A boolean value indicating whether or not live storage has been loaded.