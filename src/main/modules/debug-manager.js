const { app } = require("electron");

const applicationManager = require("./application-manager");

const actions = {
    openDevTools() {
        applicationManager.openDevTools();
    },
    checkNewVersion() {
        applicationManager.checkNewVersion("0.0.0");
    },
    openUserFolder() {
        applicationManager.openPath(app.getPath("userData"));
    },
    openTempFolder() {
        applicationManager.openPath(app.getPath("temp"));
    }
};

function executeDebugAction(message) {
    actions[message.action]();
};

module.exports = {
    executeDebugAction: executeDebugAction
};