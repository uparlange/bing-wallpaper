const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const loggerManager = require("./logger-manager");

const WALLPAPER_VIEW = "/wallpaper";
const ABOUT_VIEW = "/about";

const showView = (view) => {
    loggerManager.getLogger().info("ViewManager - Show View : " + view);
    storageManager.setData("view", view);
    eventbusManager.sendRendererMessage("showView", view);
};

const getCurrentView = () => {
    return storageManager.getData("view", WALLPAPER_VIEW).value;
};

const init = () => {
    return new Promise((resolve, reject) => {
        showView(getCurrentView());
        setTimeout(() => {
            resolve();
        }, 0);
    });
};

module.exports = {
    WALLPAPER_VIEW: WALLPAPER_VIEW,
    ABOUT_VIEW: ABOUT_VIEW,
    init: init,
    showView: showView,
    getCurrentView: getCurrentView
};