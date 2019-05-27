const storage = LiveStorage;
const controls = document.getElementById('controls');
const colorCheckbox = document.getElementById('showBackgroundColor');
const colorCombobox = document.getElementById('backgroundColor');

// add a normal data listener
storage.addListener('backgroundColor', updateCombobox);

// add a data listener specific to storage.sync that runs on storage load
storage.addListener('showBackgroundColor', change => {
    colorCheckbox.checked = change.value;
}, { area: 'sync', onLoad: true });

// load the storage and upon load, update the combobox with storage data
storage.load().then(() => {
    updateCombobox();
});

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