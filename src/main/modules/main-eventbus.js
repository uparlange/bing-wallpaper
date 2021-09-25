const eventbusManager = require("./eventbus-manager");
const viewManager = require("./view-manager");
const wallpaperManager = require("./wallpaper-manager");
const applicationManager = require("./application-manager");
const i18nManager = require("./i18n-manager");
const historyManager = require("./history-manager");
const loggerManager = require("./logger-manager");

const init = () => {
    // history manager
    eventbusManager.onRendererInvoke("getHistoryItems", () => {
        return historyManager.getItems();
    });
    eventbusManager.onRendererMessage("removeHistoryItem", (message) => {
        historyManager.removeItem(message.id);
    });
    eventbusManager.onRendererMessage("removeAllHistoryItems", (message) => {
        historyManager.removeAllItems();
    });
    // wallpaper manager
    eventbusManager.onRendererInvoke("getCurrentWallpaperPath", () => {
        return wallpaperManager.getCurrentWallpaperPath();
    });
    eventbusManager.onRendererInvoke("getSourceDescriptions", () => {
        return wallpaperManager.getSourceDescriptions();
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
    eventbusManager.onRendererMessage("updateMyApplication", (message) => {
        // 'updateApplication' event seems used internaly by electron
        applicationManager.updateApplication(message.version);
    });
    eventbusManager.onRendererInvoke("getVersions", () => {
        return applicationManager.getVersions();
    });
    // i18n manager
    eventbusManager.onRendererInvoke("getTranslations", (message) => {
        return i18nManager.getTranslations(message.keyList, message.options);
    });
    loggerManager.getLogger().info("MainEventbus - Init : OK");
};

module.exports = {
    init: init
};