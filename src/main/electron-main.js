const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const applicationManager = require("./modules/application-manager");
const wallpaperManager = require("./modules/wallpaper-manager");
const menuManager = require("./modules/menu-manager");
const i18nManager = require("./modules/i18n-manager");
const storageManager = require("./modules/storage-manager");
const viewManager = require("./modules/view-manager");
const eventbusManager = require("./modules/eventbus-manager");

let win = null;

const createWindow = () => {
    return new Promise((resolve, reject) => {
        win = new BrowserWindow({
            width: 640,
            height: 400,
            resizable: applicationManager.isDebug(),
            icon: path.join(__dirname, "..", "renderer", "assets", "images", "icon.png"),
            webPreferences: {
                preload: path.join(__dirname, "electron-preload.js")
            }
        });
        win.loadFile(path.join(__dirname, "..", "renderer", "index.html")).then(() => {
            viewManager.showView(viewManager.getCurrentView());
            resolve();
        });
        win.on("closed", () => {
            win = null;
        });
    });
};

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
        createWindow().then(() => {
            wallpaperManager.init();
        });
    });
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
    if (!applicationManager.isMac()) applicationManager.quit()
});