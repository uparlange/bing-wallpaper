const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

let onLine = false;

const isOnLine = () => {
    logStatus();
    return onLine;
};

const logStatus = () => {
    loggerManager.getLogger().info("ConnectionManager - Online '" + onLine + "'");
};

const onConnectionChanged = (callback) => {
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