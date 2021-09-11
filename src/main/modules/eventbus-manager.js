const { ipcMain, ipcRenderer } = require("electron");

const sendRendererMessage = (eventName, ...message) => {
    const applicationManager = require("./application-manager");
    const win = applicationManager.getMainWindow();
    if (win != null) {
        win.webContents.send(eventName, ...message);
    }
};

const sendMainMessage = (eventName, ...message) => {
    ipcRenderer.send(eventName, ...message);
};

const onRendererMessage = (eventName, callback) => {
    ipcMain.on(eventName, (event, ...message) => {
        callback(...message);
    });
};

const onMainMessage = (eventName, callback) => {
    ipcRenderer.on(eventName, (event, ...message) => {
        callback(...message);
    });
};

const sendMainInvoke = (eventName, ...message) => {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke(eventName, ...message).then((result) => {
            resolve(result);
        });
    });
};

const onRendererInvoke = (eventName, callback) => {
    ipcMain.handle(eventName, (event, ...message) => {
        return callback(...message);
    });
};

module.exports = {
    sendRendererMessage: sendRendererMessage,
    onRendererMessage: onRendererMessage,
    onRendererInvoke: onRendererInvoke,
    sendMainMessage: sendMainMessage,
    sendMainInvoke: sendMainInvoke,
    onMainMessage: onMainMessage,
}