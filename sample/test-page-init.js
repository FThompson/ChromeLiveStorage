const storage = new LiveStorage(data => {
    console.log(data); // initialize ui according to data
});
storage.addListener('liveStorageTest', change => {
    document.getElementById('liveStorageTest').checked = change.newValue;
});

document.getElementById('liveStorageTest').addEventListener('change', function() {
    storage.sync.liveStorageTest = this.checked;
    storage.local.liveStorageTest2 = !this.checked;
});

