const { app } = require("electron");

const applicationManager = require("./modules/application-manager");
const wallpaperManager = require("./modules/wallpaper-manager");
const menuManager = require("./modules/menu-manager");
const i18nManager = require("./modules/i18n-manager");
const storageManager = require("./modules/storage-manager");
const eventbusManager = require("./modules/eventbus-manager");
const trayManager = require("./modules/tray-manager");

const initRendererEventBus = () => {
    // wallpaper manager
    eventbusManager.onRendererInvoke("getB64Wallpaper", () => {
        return wallpaperManager.getB64Wallpaper();
    });
    eventbusManager.onRendererMessage("setUserWallpaper", (path) => {
        wallpaperManager.setUserWallpaper(path);
    });
    // application manager
    eventbusManager.onRendererMessage("openExternal", (url) => {
        applicationManager.openExternal(url);
    });
    eventbusManager.onRendererMessage("updateMyApplication", (version) => {
        // 'updateApplication' event seems used internaly by electron
        applicationManager.updateApplication(version);
    });
    eventbusManager.onRendererInvoke("getVersions", () => {
        return applicationManager.getVersions();
    });
    // i18n manager
    eventbusManager.onRendererInvoke("getTranslations", (keyList, options) => {
        return i18nManager.getTranslations(keyList, options);
    });
};

app.whenReady().then(() => {
    initRendererEventBus();
    storageManager.init().then(i18nManager.init).then(applicationManager.init).then(() => {
        menuManager.init();
        trayManager.init();
        applicationManager.createWindow().then(() => {
            wallpaperManager.init();
        });
    });
});

app.on("activate", () => {
    applicationManager.createWindow();
});

app.on("window-all-closed", () => {
    // Ovveride default behaviour
});