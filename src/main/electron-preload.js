const { contextBridge, ipcRenderer } = require("electron");

const eventbusManager = require("./modules/eventbus-manager");

// Eventbus Manager
contextBridge.exposeInMainWorld("api", {
    invoke: (eventName, message) => {
        return new Promise((resolve, reject) => {
            ipcRenderer.invoke(eventName, message).then((result) => {
                resolve(result);
            });
        });
    },
    send: (eventName, message) => {
        eventbusManager.sendMainMessage(eventName, message);
    },
    receive: (eventName, callback) => {
        ipcRenderer.on(eventName, (event, ...message) => {
            callback(...message);
        });
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