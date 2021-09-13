const { app } = require("electron");

const mainEventbus = require("./modules/main-eventbus");
const applicationManager = require("./modules/application-manager");
const wallpaperManager = require("./modules/wallpaper-manager");
const menuManager = require("./modules/menu-manager");
const i18nManager = require("./modules/i18n-manager");
const storageManager = require("./modules/storage-manager");
const trayManager = require("./modules/tray-manager");
const viewManager = require("./modules/view-manager");
const touchbarManager = require("./modules/touchbar-manager");

app.whenReady().then(() => {
    mainEventbus.init().then(storageManager.init).then(i18nManager.init).then(applicationManager.init).then(() => {
        menuManager.init();
        trayManager.init();
        touchbarManager.init();
        viewManager.init();
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