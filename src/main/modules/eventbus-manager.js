import { ipcMain, ipcRenderer } from "electron";

function sendRendererMessage(eventName, message) {
    import("./application-manager").then((obj) => {
        const applicationManager = obj.default;
        const win = applicationManager.getMainWindow();
        if (win != null) {
            win.webContents.send(eventName, message);
        }
    });
};

function sendMainMessage(eventName, message) {
    ipcRenderer.send(eventName, message);
};

function onRendererMessage(eventName, callback) {
    ipcMain.on(eventName, (event, message) => {
        callback(message);
    });
};

function onMainMessage(eventName, callback) {
    ipcRenderer.on(eventName, (event, message) => {
        callback(message);
    });
};

function sendMainInvoke(eventName, message) {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke(eventName, message).then((result) => {
            resolve(result);
        });
    });
};

function onRendererInvoke(eventName, callback) {
    ipcMain.handle(eventName, (event, message) => {
        return callback(message);
    });
};

export default {
    sendRendererMessage: sendRendererMessage,
    onRendererMessage: onRendererMessage,
    onRendererInvoke: onRendererInvoke,
    sendMainMessage: sendMainMessage,
    sendMainInvoke: sendMainInvoke,
    onMainMessage: onMainMessage,
}