import EventEmitter from "events";

import eventbusManager from "./eventbus-manager";
import loggerManager from "./logger-manager";

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

export default {
    isOnLine: isOnLine,
    onConnectionChanged: onConnectionChanged
};