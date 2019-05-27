const storage = LiveStorage;
storage.load();

storage.addListener('backgroundColor', change => {
    console.log('backgroundColor: ' + change.value);
});

storage.addListener('showBackgroundColor', change => {
    console.log('showBackgroundColor: ' + change.value);
})