const eventbusManager = require("./eventbus-manager");
const viewManager = require("./view-manager");
const wallpaperManager = require("./wallpaper-manager");
const applicationManager = require("./application-manager");
const i18nManager = require("./i18n-manager");
const historyManager = require("./history-manager");
const debugManager = require("./debug-manager");
const loggerManager = require("./logger-manager");

function init() {
    // history manager
    eventbusManager.onRendererInvoke("getHistoryItems", () => {
        return historyManager.getItems();
    });
    eventbusManager.onRendererMessage("removeHistoryItem", (message) => {
        historyManager.removeItemById(message.id);
    });
    eventbusManager.onRendererMessage("removeAllHistoryItems", (message) => {
        historyManager.removeAllItems();
    });
    // wallpaper manager
    eventbusManager.onRendererInvoke("getCurrentWallpaperSource", () => {
        return wallpaperManager.getCurrentWallpaperSource();
    });
    eventbusManager.onRendererInvoke("getWallpaperAvailableSources", () => {
        return wallpaperManager.getAvailableSources();
    });
    eventbusManager.onRendererMessage("setUserWallpaper", (message) => {
        wallpaperManager.setUserWallpaper(message.path);
    });
    eventbusManager.onRendererMessage("setWallpaperSource", (message) => {
        wallpaperManager.setSource(message.source);
    });
    // application manager
    eventbusManager.onRendererMessage("openExternal", (message) => {
        applicationManager.openExternal(message.url);
    });
    eventbusManager.onRendererInvoke("getVersions", () => {
        return applicationManager.getVersions();
    });
    // i18n manager
    eventbusManager.onRendererInvoke("getTranslations", (message) => {
        return i18nManager.getTranslations(message.keyList, message.options);
    });
    // debug manager manager
    eventbusManager.onRendererMessage("executeDebugAction", (message) => {
        debugManager.executeDebugAction(message);
    });
    loggerManager.getLogger().info("MainEventbus - Init : OK");
};

module.exports = {
    init: init
};