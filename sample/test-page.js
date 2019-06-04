/**
 * This page, loaded into both the popup and options views, synchronizes the
 * checkbox and combobox controls with the underlying live storage object.
 */

const storage = LiveStorage;
const controls = document.getElementById('controls');
const colorCheckbox = document.getElementById('showBackgroundColor');
const colorCombobox = document.getElementById('backgroundColor');

// add a normal data listener
storage.addListener('backgroundColor', updateCombobox);

// add a data listener specific to storage.sync that won't run on storage load
storage.addListener('showBackgroundColor', change => {
    colorCheckbox.checked = change.value;
}, { area: 'sync', onLoad: false });

// load the storage and upon load, update the combobox with storage data
storage.load().then(() => {
    console.log(storage);
    // listener for showBackgroundColor will be called if that data is loaded
    updateCombobox(); // the backgroundColor listener is not run onLoad
}).catch(err => alert(err)); // use catch to handle storage loading errors

// define handleError to handle errors that occur upon set/delete.
// an error can occur as a result of exceeding storage data quota limits
storage.onError = (message, info) => {
    console.warn('Custom error handler:', message, info);
    alert('Error: ' + message);
};

// update the selected color to match the value in storage
function updateCombobox() {
    colorCombobox.value = storage.local.backgroundColor;
    controls.style.backgroundColor = storage.local.backgroundColor;
}

// set the storage value on checkbox change
colorCheckbox.addEventListener('change', function() {
    storage.sync.showBackgroundColor = this.checked;
});

// set the storage value on combobox change
colorCombobox.addEventListener('change', function() {
    storage.local.backgroundColor = this.value;
});

document.getElementById('causeRuntimeError').addEventListener('click', () => {
    causeRuntimeError();
});

function causeRuntimeError() {
    let payload = '';
    for (let i = 0; i < chrome.storage.sync.QUOTA_BYTES_PER_ITEM; i++) {
        payload += ' ';
    }
    storage.sync.payload = payload;
}