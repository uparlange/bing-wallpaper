const { contextBridge } = require("electron");

const eventbusManager = require("./modules/eventbus-manager");

// Eventbus Manager
contextBridge.exposeInMainWorld("eventbus", {
    sendMainInvoke: (eventName, ...message) => {
        return eventbusManager.sendMainInvoke(eventName, ...message);
    },
    sendMainMessage: (eventName, ...message) => {
        eventbusManager.sendMainMessage(eventName, ...message);
    },
    onMainMessage: (eventName, callback) => {
        eventbusManager.onMainMessage(eventName, callback);
    }
});

// Connection Manager
eventbusManager.sendMainMessage("connectionChanged", navigator.onLine);
window.addEventListener("online", () => {
    eventbusManager.sendMainMessage("connectionChanged", true);
});
window.addEventListener("offline", () => {
    eventbusManager.sendMainMessage("connectionChanged", false);
});