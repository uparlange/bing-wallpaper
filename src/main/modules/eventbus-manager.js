const { ipcMain, ipcRenderer, BrowserWindow } = require("electron");

const sendRendererMessage = (eventName, message) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win != null) {
        win.webContents.send(eventName, message);
    }
};

const sendMainMessage = (eventName, message) => {
    ipcRenderer.send(eventName, message);
};

const onRendererMessage = (eventName, callback) => {
    ipcMain.on(eventName, (event, message) => {
        callback(message);
    });
};

const onRendererInvoke = (eventName, callback) => {
    ipcMain.handle(eventName, (event, message) => {
        return callback(message);
    });
};

module.exports = {
    onRendererMessage: onRendererMessage,
    onRendererInvoke: onRendererInvoke,
    sendRendererMessage: sendRendererMessage,
    sendMainMessage: sendMainMessage
}