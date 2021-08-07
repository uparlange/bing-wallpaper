const { BrowserWindow, ipcMain, contextBridge, ipcRenderer } = require("electron");
const EventEmitter = require("events");

const eventEmitter = new EventEmitter();

const sendRendererMessage = (name, message) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win != null) {
        win.webContents.send("fromMain", {
            name: name,
            message: message
        });
    }
};

const onRendererMessage = (eventName, callback) => {
    eventEmitter.on(eventName, callback);
};

const initForMain = () => {
    ipcMain.on("toMain", (event, data) => {
        eventEmitter.emit(data.name, data.message);
    });
}

const initForRenderer = () => {
    contextBridge.exposeInMainWorld("api", {
        send: (channel, data) => {
            let validChannels = ["toMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["fromMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    });
}

module.exports = {
    initForMain: initForMain,
    initForRenderer: initForRenderer,
    sendRendererMessage: sendRendererMessage,
    onRendererMessage: onRendererMessage
}