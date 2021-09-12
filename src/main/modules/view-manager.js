const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

const WALLPAPER_VIEW = "/wallpaper";
const ABOUT_VIEW = "/about";
const SOURCES_VIEW = "/sources";

const showView = (view) => {
    loggerManager.getLogger().info("ViewManager - Show View '" + view + "'");
    storageManager.setData("view", view);
    eventbusManager.sendRendererMessage("viewChanged", view);
    eventEmitter.emit("viewChanged", getCurrentView());
};

const getCurrentView = () => {
    return storageManager.getData("view", WALLPAPER_VIEW).value;
};

const getAvailableViews = () => {
    return [WALLPAPER_VIEW, ABOUT_VIEW, SOURCES_VIEW];
};

const onViewChanged = (callback) => {
    eventEmitter.on("viewChanged", callback);
};

const init = () => {
    loggerManager.getLogger().info("ViewManager - Init : OK");
};

module.exports = {
    WALLPAPER_VIEW: WALLPAPER_VIEW,
    ABOUT_VIEW: ABOUT_VIEW,
    SOURCES_VIEW: SOURCES_VIEW,
    init: init,
    getAvailableViews: getAvailableViews,
    showView: showView,
    getCurrentView: getCurrentView,
    onViewChanged: onViewChanged
};