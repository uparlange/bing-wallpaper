import { globalShortcut } from "electron";

import loggerManager from "./logger-manager";
import viewManager from "./view-manager";
import wallpaperManager from "./wallpaper-manager";
import i18nManager from "./i18n-manager";
import themeManager from "./theme-manager";
import applicationManager from "./application-manager";

let enable = false;

function disableAll() {
    if (enable) {
        globalShortcut.unregisterAll();
        enable = false;
        loggerManager.getLogger().info("ShortcutManager : disableAll");
    }
};

function enableAll() {
    if (!enable) {
        // application manager
        globalShortcut.register("CommandOrControl+O", () => {
            applicationManager.openDevTools();
        });
        // view manager
        globalShortcut.register("CommandOrControl+Right", () => {
            viewManager.showNextView();
        });
        globalShortcut.register("CommandOrControl+Left", () => {
            viewManager.showPreviousView();
        });
        globalShortcut.register("CommandOrControl+D", () => {
            viewManager.showView(viewManager.DEBUG_VIEW);
        });
        // wallpaper manager
        globalShortcut.register("CommandOrControl+Up", () => {
            wallpaperManager.showPreviousWallpaper();
        });
        globalShortcut.register("CommandOrControl+Down", () => {
            wallpaperManager.showNextWallpaper();
        });
        // i18n manager
        globalShortcut.register("CommandOrControl+L", () => {
            i18nManager.setNextLanguage();
        });
        // theme manager
        globalShortcut.register("CommandOrControl+T", () => {
            themeManager.setNextTheme();
        });
        enable = true;
        loggerManager.getLogger().info("ShortcutManager : enableAll");
    }
};

function init() {
    enableAll();
    applicationManager.onWindowStatusChanged((message) => {
        if (message.opened) {
            enableAll();
        } else {
            disableAll();
        }
    });
    loggerManager.getLogger().info("ShortcutManager - Init : OK");
};

function destroy() {
    disableAll();
    loggerManager.getLogger().info("ShortcutManager - Destroy : OK");
};

export default {
    init: init,
    enableAll: enableAll,
    disableAll: disableAll,
    destroy: destroy
};