const { globalShortcut } = require("electron");

const loggerManager = require("./logger-manager");
const viewManager = require("./view-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const themeManager = require("./theme-manager");
const applicationManager = require("./application-manager");

function init() {
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
    loggerManager.getLogger().info("ShortcutManager - Init : OK");
};

function destroy() {
    globalShortcut.unregisterAll();
    loggerManager.getLogger().info("ShortcutManager - Destroy : OK");
};

module.exports = {
    init: init,
    destroy: destroy
};