const EventEmitter = require("events");

const applicationUtils = require("./application-utils");
const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const loggerManager = require("./logger-manager");

const SOURCES_VIEW = "sources";
const DEBUG_VIEW = "debug";

const eventEmitter = new EventEmitter();
const views = [
    { id: "wallpaper" },
    { id: SOURCES_VIEW },
    { id: "history", separatorAfter: true },
    { id: "screensaver", separatorAfter: true },
    { id: "about" },
];
if (applicationUtils.isDebug()) {
    views.unshift({ id: "debug", separatorAfter: true });
}

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

function showNextView() {
    const index = views.findIndex((element) => element.id == getCurrentView());
    const nextView = (index < (views.length - 1)) ? views[index + 1].id : views[0].id;
    showView(nextView);
};

function showPreviousView() {
    const index = views.findIndex((element) => element.id == getCurrentView());
    const previousView = (index > 0) ? views[index - 1].id : views[views.length - 1].id;
    showView(previousView);
};

function showView(view) {
    loggerManager.getLogger().info("ViewManager - Show View '" + view + "'");
    storageManager.setData("view", view);
    const message = getMessage(view);
    eventbusManager.sendRendererMessage("viewChanged", message);
    eventEmitter.emit("viewChanged", message);
};

function getCurrentView() {
    return storageManager.getData("view", views[0].id).value;
};

function getAvailableViews() {
    return views.map((view) => {
        const message = getMessage(view.id);
        message.separatorAfter = view.separatorAfter;
        return message;
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
    DEBUG_VIEW: DEBUG_VIEW,
    init: init,
    getAvailableViews: getAvailableViews,
    showView: showView,
    showNextView: showNextView,
    showPreviousView: showPreviousView,
    getCurrentView: getCurrentView,
    onViewChanged: onViewChanged
};