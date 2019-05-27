const storage = LiveStorage;

storage.addListener('showBackgroundColor', change => {
    // this uses change.value, but storage.sync.showBackgroundColor works too
    setBodyColor(change.value ? storage.local.backgroundColor : '');
}, { onLoad: true });

storage.addListener('backgroundColor', () => {
    if (storage.sync.showBackgroundColor) {
        setBodyColor(storage.local.backgroundColor);
    }
});

storage.load();

function setBodyColor(color) {
    document.body.style.backgroundColor = color;
}