const eventbusManager = require("./eventbus-manager");
const viewManager = require("./view-manager");
const wallpaperManager = require("./wallpaper-manager");
const applicationManager = require("./application-manager");
const i18nManager = require("./i18n-manager");

const init = () => {
    return new Promise((resolve, reject) => {
        // wallpaper manager
        eventbusManager.onRendererInvoke("getB64Wallpaper", () => {
            return wallpaperManager.getB64Wallpaper();
        });
        eventbusManager.onRendererInvoke("getSourceDescriptions", () => {
            return wallpaperManager.getSourceDescriptions();
        });
        eventbusManager.onRendererMessage("setUserWallpaper", (path) => {
            wallpaperManager.setUserWallpaper(path);
        });
        eventbusManager.onRendererMessage("setWallpaperSource", (source) => {
            wallpaperManager.setSource(source);
        });
        // application manager
        eventbusManager.onRendererMessage("openExternal", (url) => {
            applicationManager.openExternal(url);
        });
        eventbusManager.onRendererMessage("updateMyApplication", (version) => {
            // 'updateApplication' event seems used internaly by electron
            applicationManager.updateApplication(version);
        });
        eventbusManager.onRendererInvoke("getVersions", () => {
            return applicationManager.getVersions();
        });
        // i18n manager
        eventbusManager.onRendererInvoke("getTranslations", (keyList, options) => {
            return i18nManager.getTranslations(keyList, options);
        });
        // view manager
        eventbusManager.onRendererMessage("showView", (view) => {
            viewManager.showView(view);
        });
        resolve();
    });
};

module.exports = {
    init: init
};