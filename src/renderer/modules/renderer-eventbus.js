const eventEmitter = mitt();

// common
function addEventListener(eventName, callback) {
    eventEmitter.on(eventName, callback);
};
function removeEventListener(eventName, callback) {
    eventEmitter.off(eventName, callback);
};
function sendMainMessage(eventName, message) {
    window.eventbus.sendMainMessage(eventName, message);
};

// i18n manager
window.eventbus.onMainMessage("languageChanged", function (message) {
    eventEmitter.emit("languageChanged", message);
});

// wallpaper manager
window.eventbus.onMainMessage("wallpaperChanged", function (message) {
    eventEmitter.emit("wallpaperChanged", message);
});

// view manager
window.eventbus.onMainMessage("viewChanged", function (message) {
    eventEmitter.emit("viewChanged", message);
});

// application manager
window.eventbus.onMainMessage("downloadProgress", function (message) {
    eventEmitter.emit("downloadProgress", message);
});

// history manager
window.eventbus.onMainMessage("historyChanged", function () {
    eventEmitter.emit("historyChanged");
});

export default {
    executeDebugAction(message) {
        sendMainMessage("executeDebugAction", message);
    },
    removeHistoryItem(message) {
        sendMainMessage("removeHistoryItem", message);
    },
    removeAllHistoryItems(message) {
        sendMainMessage("removeAllHistoryItems", message);
    },
    setWallpaperSource(message) {
        sendMainMessage("setWallpaperSource", message);
    },
    setUserWallpaper(message) {
        sendMainMessage("setUserWallpaper", message);
    },
    openExternal(message) {
        sendMainMessage("openExternal", message);
    },
    onHistoryChanged(callback) {
        addEventListener("historyChanged", callback);
    },
    offHistoryChanged(callback) {
        removeEventListener("historyChanged", callback);
    },
    onDownloadProgress(callback) {
        addEventListener("downloadProgress", callback);
    },
    offDownloadProgress(callback) {
        removeEventListener("downloadProgress", callback);
    },
    onLanguageChanged(callback) {
        addEventListener("languageChanged", callback);
    },
    offLanguageChanged(callback) {
        removeEventListener("languageChanged", callback);
    },
    onWallpaperChanged(callback) {
        addEventListener("wallpaperChanged", callback);
    },
    offWallpaperChanged(callback) {
        removeEventListener("wallpaperChanged", callback);
    },
    onViewChanged(callback) {
        addEventListener("viewChanged", callback);
    },
    offViewChanged(callback) {
        removeEventListener("viewChanged", callback);
    },
    getVersions() {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getVersions").then((versions) => {
                resolve(versions);
            });
        });
    },
    getCurrentWallpaperSource() {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getCurrentWallpaperSource").then((source) => {
                resolve(source);
            });
        });
    },
    getWallpaperAvailableSources() {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getWallpaperAvailableSources").then((sources) => {
                resolve(sources);
            });
        });
    },
    getTranslations(keyList, options) {
        return new Promise((resolve, reject) => {
            const message = {
                keyList: keyList,
                options: options
            };
            window.eventbus.sendMainInvoke("getTranslations", message).then((translations) => {
                resolve(translations);
            });
        });
    },
    getHistoryItems() {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getHistoryItems").then((items) => {
                resolve(items);
            });
        });
    }
};