const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const loggerManager = require("./logger-manager");

const SOURCES_VIEW = "sources";

const eventEmitter = new EventEmitter();
const views = ["wallpaper", SOURCES_VIEW, "history", "about"];

function getLabelKey(view) {
    return view.toUpperCase() + "_VIEW_LABEL";
};

function getMessage(view) {
    return {
        view: view,
        labelKey: getLabelKey(view),
        current: getCurrentView() == view
    };
};

function showView(view) {
    loggerManager.getLogger().info("ViewManager - Show View '" + view + "'");
    storageManager.setData("view", view);
    const message = getMessage(view);
    eventbusManager.sendRendererMessage("viewChanged", message);
    eventEmitter.emit("viewChanged", message);
};

function getCurrentView() {
    return storageManager.getData("view", views[0]).value;
};

function getAvailableViews() {
    return views.map((view) => {
        return getMessage(view);
    });
};

function onViewChanged(callback) {
    eventEmitter.on("viewChanged", callback);
};

function init() {
    loggerManager.getLogger().info("ViewManager - Init : OK");
};

module.exports = {
    SOURCES_VIEW: SOURCES_VIEW,
    init: init,
    getAvailableViews: getAvailableViews,
    showView: showView,
    getCurrentView: getCurrentView,
    onViewChanged: onViewChanged
};