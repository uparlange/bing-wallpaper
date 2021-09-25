const eventEmitter = mitt();

const addEventListener = (eventName, callback) => {
    eventEmitter.on(eventName, callback);
    //console.debug(eventEmitter.all);
};

const removeEventListener = (eventName, callback) => {
    eventEmitter.off(eventName, callback);
    //console.debug(eventEmitter.all);
};

const sendMainMessage = (eventName, message) => {
    window.eventbus.sendMainMessage(eventName, message);
};

// i18n manager
window.eventbus.onMainMessage("languageChanged", (message) => {
    eventEmitter.emit("languageChanged", message);
});

// wallpaper manager
window.eventbus.onMainMessage("wallpaperChanged", (message) => {
    eventEmitter.emit("wallpaperChanged", message);
});

// view manager
window.eventbus.onMainMessage("viewChanged", (message) => {
    eventEmitter.emit("viewChanged", message);
});

// application manager
window.eventbus.onMainMessage("newVersionAvailable", (message) => {
    eventEmitter.emit("newVersionAvailable", message);
});
window.eventbus.onMainMessage("downloadProgress", (message) => {
    eventEmitter.emit("downloadProgress", message);
});

// history manager
window.eventbus.onMainMessage("historyChanged", () => {
    eventEmitter.emit("historyChanged");
});

export default {
    removeHistoryItem: (message) => {
        sendMainMessage("removeHistoryItem", message);
    },
    removeAllHistoryItems: (message) => {
        sendMainMessage("removeAllHistoryItems", message);
    },
    setWallpaperSource: (message) => {
        sendMainMessage("setWallpaperSource", message);
    },
    setWallpaperSource: (message) => {
        sendMainMessage("setWallpaperSource", message);
    },
    setUserWallpaper: (message) => {
        sendMainMessage("setUserWallpaper", message);
    },
    updateMyApplication: (message) => {
        sendMainMessage("updateMyApplication", message);
    },
    openExternal: (message) => {
        sendMainMessage("openExternal", message);
    },
    onHistoryChanged: (callback) => {
        addEventListener("historyChanged", callback);
    },
    offHistoryChanged: (callback) => {
        removeEventListener("historyChanged", callback);
    },
    onDownloadProgress: (callback) => {
        addEventListener("downloadProgress", callback);
    },
    offDownloadProgress: (callback) => {
        removeEventListener("downloadProgress", callback);
    },
    onLanguageChanged: (callback) => {
        addEventListener("languageChanged", callback);
    },
    offLanguageChanged: (callback) => {
        removeEventListener("languageChanged", callback);
    },
    onWallpaperChanged: (callback) => {
        addEventListener("wallpaperChanged", callback);
    },
    offWallpaperChanged: (callback) => {
        removeEventListener("wallpaperChanged", callback);
    },
    onViewChanged: (callback) => {
        addEventListener("viewChanged", callback);
    },
    offViewChanged: (callback) => {
        removeEventListener("viewChanged", callback);
    },
    onNewVersionAvailable: (callback) => {
        addEventListener("newVersionAvailable", callback);
    },
    offNewVersionAvailable: (callback) => {
        removeEventListener("newVersionAvailable", callback);
    },
    getVersions: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getVersions").then((versions) => {
                resolve(versions);
            });
        });
    },
    getCurrentWallpaperPath: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getCurrentWallpaperPath").then((path) => {
                resolve(path);
            });
        });
    },
    getSourceDescriptions: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getSourceDescriptions").then((sourceDescriptions) => {
                resolve(sourceDescriptions);
            });
        });
    },
    getTranslations: (keyList, options) => {
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
    getHistoryItems: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getHistoryItems").then((items) => {
                resolve(items);
            });
        });
    }
};