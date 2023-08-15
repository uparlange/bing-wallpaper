import eventbusManager from "./eventbus-manager";
import wallpaperManager from "./wallpaper-manager";
import applicationManager from "./application-manager";
import i18nManager from "./i18n-manager";
import historyManager from "./history-manager";
import debugManager from "./debug-manager";
import loggerManager from "./logger-manager";

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
    // debug manager
    eventbusManager.onRendererMessage("executeDebugAction", (message) => {
        debugManager.executeDebugAction(message);
    });
    loggerManager.getLogger().info("MainEventbus - Init : OK");
};

export default {
    init: init
};