const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const pkg = require("./package.json");
const wallpaperManager = require("./modules/wallpaper-manager");
const loggerManager = require("./modules/logger-manager");
const eventbusManager = require("./modules/eventbus-manager");
const menuManager = require("./modules/menu-manager");

let win = null;

const isMac = () => {
    return process.platform === "darwin";
}

const createWindow = () => {
    win = new BrowserWindow({
        width: 640,
        height: 400,
        show: false,
        resizable: false,
        icon: path.join(__dirname, "build", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "electron-preload.js")
        }
    });
    win.loadFile("index.html").then(() => {
        wallpaperManager.refreshRendererWallpaper();
        refreshRendererVersions();
    });
    win.on("ready-to-show", function () {
        win.show();
        win.focus();
    });
    win.on("closed", () => {
        win = null;
    });
};

const refreshRendererVersions = () => {
    const versions = Object.assign({}, process.versions);
    versions.application = pkg.version;
    eventbusManager.sendRendererMessage("updateData", {
        key: "versions",
        value: versions
    });
};

const initWindow = () => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
};

const initEvents = () => {
    eventbusManager.onRendererMessage("setUserWallpaper", (event) => {
        wallpaperManager.setUserWallpaper(event.path);
    });
    eventbusManager.onRendererMessage("openExternal", (event) => {
        shell.openExternal(event.url);
    });
};

app.whenReady().then(() => {
    loggerManager.init();
    eventbusManager.initForMain();
    menuManager.init();
    initEvents();
    initWindow();
    wallpaperManager.init();
});

app.on("window-all-closed", () => {
    if (!isMac()) app.quit()
});