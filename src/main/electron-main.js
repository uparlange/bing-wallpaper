import { app } from "electron";

import mainEventbus from "./modules/main-eventbus";
import applicationManager from "./modules/application-manager";
import wallpaperManager from "./modules/wallpaper-manager";
import menuManager from "./modules/menu-manager";
import i18nManager from "./modules/i18n-manager";
import storageManager from "./modules/storage-manager";
import trayManager from "./modules/tray-manager";
import viewManager from "./modules/view-manager";
import touchbarManager from "./modules/touchbar-manager";
import historyManager from "./modules/history-manager";
import themeManager from "./modules/theme-manager";
import shortcutManager from "./modules/shortcut-manager";

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