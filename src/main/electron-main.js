const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const pkg = require("./../../package.json");
const applicationUtils = require("./modules/application-utils");
const wallpaperManager = require("./modules/wallpaper-manager");
const eventbusManager = require("./modules/eventbus-manager");
const menuManager = require("./modules/menu-manager");
const i18nManager = require("./modules/i18n-manager");
const storageManager = require("./modules/storage-manager");
const viewManager = require("./modules/view-manager");

let win = null;

const createWindow = () => {
    return new Promise((resolve, reject) => {
        win = new BrowserWindow({
            width: 640,
            height: 400,
            resizable: applicationUtils.isDebug(),
            icon: path.join(__dirname, "..", "renderer", "assets", "images", "icon.png"),
            webPreferences: {
                preload: path.join(__dirname, "electron-preload.js")
            }
        });
        win.loadFile(path.join(__dirname, "..", "renderer", "index.html")).then(() => {
            resolve();
        });
        win.on("closed", () => {
            win = null;
        });
    });
};

const initEventBus = () => {
    eventbusManager.initForMain().then(() => {
        eventbusManager.onRendererInvoke("getVersions", () => {
            const versions = Object.assign({}, process.versions);
            versions.application = pkg.version;
            versions.vue = pkg.dependencies.vue.replace("^", "");
            versions.vueRouter = pkg.dependencies["vue-router"].replace("^", "");
            return versions;
        });
        eventbusManager.onRendererInvoke("getB64Wallpaper", () => {
            return wallpaperManager.getB64Wallpaper();
        });
        eventbusManager.onRendererMessage("setUserWallpaper", (path) => {
            wallpaperManager.setUserWallpaper(path);
        });
        eventbusManager.onRendererMessage("openExternal", (url) => {
            shell.openExternal(url);
        });
    });
};

app.whenReady().then(() => {
    initEventBus();
    createWindow().then(() => {
        storageManager.init().then(() => {
            viewManager.init();
            wallpaperManager.init();
            i18nManager.init().then(() => {
                menuManager.init();
            });
        });
    });
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
    if (!applicationUtils.isMac()) applicationUtils.quit()
});