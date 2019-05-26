LiveStorage.load().then(storage => {
    console.log(storage); // initialize ui according to data
    storage.addListener('liveStorageTest', change => {
        document.getElementById('liveStorageTest').checked = change.newValue;
    });
});

document.getElementById('liveStorageTest').addEventListener('change', function() {
    LiveStorage.sync.liveStorageTest = this.checked;
    LiveStorage.local.liveStorageTest2 = !this.checked;
});