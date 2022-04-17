const { globalShortcut } = require("electron");

const loggerManager = require("./logger-manager");
const viewManager = require("./view-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const themeManager = require("./theme-manager");
const applicationManager = require("./application-manager");

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

module.exports = {
    init: init,
    enableAll: enableAll,
    disableAll: disableAll,
    destroy: destroy
};