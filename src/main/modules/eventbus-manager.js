const { ipcMain, contextBridge, ipcRenderer, BrowserWindow } = require("electron");
const EventEmitter = require("events");

const eventEmitter = new EventEmitter();

const sendRendererMessage = (name, message) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win != null) {
        win.webContents.send(name, message);
    }
};

const onRendererMessage = (eventName, callback) => {
    ipcMain.on(eventName, (event, args) => {
        callback(args);
    });
};

const onRendererInvoke = (eventName, callback) => {
    ipcMain.handle(eventName, (event, params) => {
        return callback(params);
    });
};

const initForMain = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
}

const initForRenderer = () => {
    return new Promise((resolve, reject) => {
        contextBridge.exposeInMainWorld("api", {
            invoke: (name, params) => {
                return new Promise((resolve, reject) => {
                    ipcRenderer.invoke(name, params).then((result) => {
                        resolve(result);
                    });
                });
            },
            send: (name, params) => {
                ipcRenderer.send(name, params);
            },
            receive: (name, callback) => {
                ipcRenderer.on(name, (event, ...args) => {
                    callback(...args);
                });
            }
        });
        setTimeout(() => {
            resolve();
        });
    });
}

module.exports = {
    initForMain: initForMain,
    initForRenderer: initForRenderer,
    onRendererInvoke: onRendererInvoke,
    sendRendererMessage: sendRendererMessage,
    onRendererMessage: onRendererMessage
}