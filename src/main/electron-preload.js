const { contextBridge } = require("electron");

const eventbusManager = require("./modules/eventbus-manager");

// Eventbus Manager
contextBridge.exposeInMainWorld("eventbus", {
    invoke: (eventName, ...message) => {
        return eventbusManager.sendMainInvoke(eventName, ...message);
    },
    send: (eventName, ...message) => {
        eventbusManager.sendMainMessage(eventName, ...message);
    },
    receive: (eventName, callback) => {
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