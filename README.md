# Chrome Extension Live Storage Object

Chrome Live Storage is a module that provides [`chrome.storage`](https://developer.chrome.com/apps/storage) data as native JavaScript objects that automatically synchronize between all extension views (background, content scripts, popups, options, etc.).

The following example demonstrates synchronizes a checkbox input with user data.

```javascript
const storage = LiveStorage;

// Load storage and update checkbox with loaded value from storage
storage.load().then(() => {
    updateCheckbox();
});

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

## Installation

Download [live-storage.js](live-storage.js) to a location within your extension directory.

If you haven't already done so, declare the "storage" permission in your extension's manifest.

```json
{
    ...
    "permissions": [
        "storage"
    ],
    ...
}
```

### Background Script

Declare live-storage.js in your manifest, before the background script.

```json
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

Declare live-storage.js in your manifest, before the content script.

```json
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

Link live-storage.js through a `script` tag, before the page script.

```html
<head>
    <script src='live-storage.js' defer></script>
    <script src='page.js' defer></script>
</head>
```

## Usage

You can use the storage object as `LiveStorage`, or declare it as any name you like.

```javascript
const storage = LiveStorage;
```

This object contains storage objects that reflect each of the three `chrome.storage` areas. You can access these using `storage.sync`, `storage.local`, and `storage.managed`. The managed storage area is read-only.

### Load the storage object

The storage object starts out empty. Load existing `chrome.storage` data into the object with the async `load` function. The resulting promise resolves with no value, but this function guarantees that the storage objects are populated before any `.then` callbacks are called.

```javascript
storage.load().then(() => {
    // Use values from storage.sync and storage.local to populate UI, etc.
    myCheckbox.checked = storage.sync.myBooleanValue;
});
```

### Make your app responsive to user data

Use `addListener` to define functions that are called when storage data changes. These listeners can make your extension responsive to storage changes made in other views (background, content, popup, options, etc.) and on other systems if you are using `sync` storage.

```javascript
storage.addListener('myBooleanValue', change => {
    myCheckbox.checked = change.value;
});
```

The `change` object passed to the callback can contain any of `oldValue`, `newValue`, and `value`. The `value` property will always contain the current value in storage. You can also access the storage object directly, `storage.sync.myBooleanValue`.

By default, listeners added in this way will not be run upon the `load` function populating the storage object. To enable that functionality, pass `onLoad: true` in the options object.

```javascript
storage.addListener('myBooleanValue', change => {
    myCheckbox.checked = change.value;
}, { onLoad: true });
```

You can restrict the listener to a specific storage area with the `area: 'sync'` option.

### Handle errors

In some situations, adding a value to storage can throw an error, such as if the storage is full or hitting its rate limit. Due to the async nature of the wrapped `chrome.storage` APIs, errors can occur after setting a value in your code. These errors are passed to an error handling callback that by default prints the error to the console as a warning.

To define your own error handling callback, set `storage.onError`. The callback function is passed a `message` parameter containing the browser API error message, and a `info` parameter containing the relevant action, storage area, data key, and data value.

```javascript
storage.onError = (message, info) => {
    console.warn(message, info);
    alert('Storage error: ' + message);
};
```