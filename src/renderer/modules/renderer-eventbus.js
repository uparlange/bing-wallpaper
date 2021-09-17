const eventEmitter = mitt();

const addEventListener = (eventName, callback) => {
    eventEmitter.on(eventName, callback);
    //console.debug(eventEmitter.all);
};

const removeEventListener = (eventName, callback) => {
    eventEmitter.off(eventName, callback);
    //console.debug(eventEmitter.all);
};

// i18n manager
window.eventbus.onMainMessage("languageChanged", (lng) => {
    eventEmitter.emit("languageChanged", lng);
});

// wallpaper manager
window.eventbus.onMainMessage("wallpaperChanged", (source) => {
    eventEmitter.emit("wallpaperChanged", source);
});
window.eventbus.onMainMessage("b64WallpaperChanged", (b64Wallpaper) => {
    eventEmitter.emit("b64WallpaperChanged", b64Wallpaper);
});

// view manager
window.eventbus.onMainMessage("viewChanged", (view) => {
    eventEmitter.emit("viewChanged", view);
});

// application manager
window.eventbus.onMainMessage("newVersionAvailable", (version) => {
    eventEmitter.emit("newVersionAvailable", version);
});
window.eventbus.onMainMessage("downloadProgress", (progress) => {
    eventEmitter.emit("downloadProgress", progress);
});

export default {
    sendMainMessage: (eventName, ...message) => {
        window.eventbus.sendMainMessage(eventName, ...message);
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
    onB64WallpaperChanged: (callback) => {
        addEventListener("b64WallpaperChanged", callback);
    },
    offB64WallpaperChanged: (callback) => {
        removeEventListener("b64WallpaperChanged", callback);
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
    getSourceDescriptions: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getSourceDescriptions").then((sourceDescriptions) => {
                resolve(sourceDescriptions);
            });
        });
    },
    getTranslations: (keyList, options) => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getTranslations", keyList, options).then((translations) => {
                resolve(translations);
            });
        });
    },
    getB64Wallpaper: () => {
        return new Promise((resolve, reject) => {
            window.eventbus.sendMainInvoke("getB64Wallpaper").then((b64Wallpaper) => {
                resolve(b64Wallpaper);
            });
        });
    },
};