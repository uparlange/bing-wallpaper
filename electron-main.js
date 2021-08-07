const { app, BrowserWindow } = require("electron");
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
        width: 960,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "electron-preload.js")
        }
    });
    win.loadFile("index.html").then(() => {
        wallpaperManager.refreshRendererWallpaper();
        refreshRendererVersions();
    });
    win.on("closed", () => {
        win = null;
    });
};

const refreshRendererVersions = () => {
    const versions = Object.assign({}, process.versions);
    console.dir(versions);
    versions.application = pkg.version;
    console.dir(versions);
    eventbusManager.sendRendererMessage("dataChanged", {
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

app.whenReady().then(() => {
    initWindow();
    loggerManager.init();
    eventbusManager.initForMain();
    menuManager.init();
    wallpaperManager.init();
});

app.on("window-all-closed", () => {
    if (!isMac()) app.quit()
});