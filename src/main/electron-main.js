const { app, BrowserWindow } = require("electron");
const path = require("path");

const applicationUtils = require("./modules/application-utils");
const wallpaperManager = require("./modules/wallpaper-manager");
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

app.whenReady().then(() => {
    storageManager.init().then(() => {
        i18nManager.init().then(() => {
            menuManager.init();
            createWindow().then(() => {
                viewManager.init();
                wallpaperManager.init();
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