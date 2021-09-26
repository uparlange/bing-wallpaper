const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

const WALLPAPER_VIEW = "/wallpaper";
const ABOUT_VIEW = "/about";
const SOURCES_VIEW = "/sources";
const HISTORY_VIEW = "/history";

function showView(view) {
    loggerManager.getLogger().info("ViewManager - Show View '" + view + "'");
    storageManager.setData("view", view);
    const message = {
        view: view
    };
    eventbusManager.sendRendererMessage("viewChanged", message);
    eventEmitter.emit("viewChanged", message);
};

function getCurrentView() {
    return storageManager.getData("view", WALLPAPER_VIEW).value;
};

function getAvailableViews() {
    return [WALLPAPER_VIEW, SOURCES_VIEW, HISTORY_VIEW, ABOUT_VIEW];
};

function onViewChanged(callback) {
    eventEmitter.on("viewChanged", callback);
};

function init() {
    loggerManager.getLogger().info("ViewManager - Init : OK");
};

module.exports = {
    WALLPAPER_VIEW: WALLPAPER_VIEW,
    ABOUT_VIEW: ABOUT_VIEW,
    SOURCES_VIEW: SOURCES_VIEW,
    HISTORY_VIEW: HISTORY_VIEW,
    init: init,
    getAvailableViews: getAvailableViews,
    showView: showView,
    getCurrentView: getCurrentView,
    onViewChanged: onViewChanged
};