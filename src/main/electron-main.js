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
const historyManager = require("./modules/history-manager");
const themeManager = require("./modules/theme-manager");
const shortcutManager = require("./modules/shortcut-manager");

app.whenReady().then(function () {
    mainEventbus.init();
    storageManager.init().then(i18nManager.init).then(applicationManager.init).then(() => {
        shortcutManager.init();
        menuManager.init();
        trayManager.init();
        touchbarManager.init();
        historyManager.init();
        themeManager.init();
        viewManager.init();
        applicationManager.createWindow().then(() => {
            wallpaperManager.init();
        });
    });
});

app.on("activate", function () {
    applicationManager.createWindow();
});

app.on("window-all-closed", function () {
    // Ovveride default behaviour
});

app.on("will-quit", () => {
    shortcutManager.destroy();
});