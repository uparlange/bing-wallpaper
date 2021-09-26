const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

let onLine = false;

function isOnLine() {
    logStatus();
    return onLine;
};

function logStatus() {
    loggerManager.getLogger().info("ConnectionManager - Online '" + onLine + "'");
};

function onConnectionChanged(callback) {
    eventEmitter.on("connectionChanged", callback);
};

eventbusManager.onRendererMessage("connectionChanged", (status) => {
    if (status != onLine) {
        onLine = status;
        logStatus();
        eventEmitter.emit("connectionChanged", status);
    }
});

module.exports = {
    isOnLine: isOnLine,
    onConnectionChanged: onConnectionChanged
};