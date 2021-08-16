const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const pkg = require("./../../package.json");
const applicationUtils = require("./modules/application-utils");
const wallpaperManager = require("./modules/wallpaper-manager");
const eventbusManager = require("./modules/eventbus-manager");
const menuManager = require("./modules/menu-manager");
const i18nManager = require("./modules/i18n-manager");

let win = null;

const createWindow = () => {
    win = new BrowserWindow({
        width: 640,
        height: 400,
        show: false,
        resizable: applicationUtils.isDebug(),
        icon: path.join(__dirname, "..", "renderer", "assets", "images", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "electron-preload.js")
        }
    });
    win.loadFile(path.join(__dirname, "..", "renderer", "index.html")).then(() => {

    });
    win.on("ready-to-show", function () {
        win.show();
        win.focus();
    });
    win.on("closed", () => {
        win = null;
    });
};

const initEventBus = () => {
    eventbusManager.initForMain().then(() => {
        eventbusManager.onRendererInvoke("getVersions", () => {
            const versions = Object.assign({}, process.versions);
            versions.application = pkg.version;
            return versions;
        });
        eventbusManager.onRendererInvoke("getB64Wallpaper", () => {
            return wallpaperManager.getB64Wallpaper();
        });
        eventbusManager.onRendererMessage("setUserWallpaper", (event) => {
            wallpaperManager.setUserWallpaper(event.path);
        });
        eventbusManager.onRendererMessage("openExternal", (event) => {
            shell.openExternal(event.url);
        });
    });
};

app.whenReady().then(() => {
    createWindow();
    initEventBus();
    wallpaperManager.init();
    i18nManager.init().then(() => {
        menuManager.init();
    });
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
    if (!applicationUtils.isMac()) app.quit()
});