import { contextBridge } from "electron";

import eventbusManager from "./modules/eventbus-manager";

// Eventbus Manager
contextBridge.exposeInMainWorld("eventbus", {
    sendMainInvoke(eventName, message) {
        return eventbusManager.sendMainInvoke(eventName, message);
    },
    sendMainMessage(eventName, message) {
        eventbusManager.sendMainMessage(eventName, message);
    },
    onMainMessage(eventName, callback) {
        eventbusManager.onMainMessage(eventName, callback);
    }
});

// Connection Manager
eventbusManager.sendMainMessage("connectionChanged", navigator.onLine);
window.addEventListener("online", function () {
    eventbusManager.sendMainMessage("connectionChanged", true);
});
window.addEventListener("offline", function () {
    eventbusManager.sendMainMessage("connectionChanged", false);
});