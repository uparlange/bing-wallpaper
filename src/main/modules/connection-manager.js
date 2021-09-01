const EventEmitter = require("events");

const eventbusManager = require("./eventbus-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

let onLine = false;

const isOnLine = () => {
    return onLine;
};

const onConnectionChanged = (callback) => {
    eventEmitter.on("connectionChanged", callback);
};

eventbusManager.onRendererMessage("connectionChanged", (status) => {
    if (status != onLine) {
        loggerManager.getLogger().info("ConnectionManager - Online '" + status + "'");
        onLine = status;
        eventEmitter.emit("connectionChanged", status);
    }
});

module.exports = {
    isOnLine: isOnLine,
    onConnectionChanged: onConnectionChanged
};