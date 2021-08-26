const { app } = require("electron");

const storageManager = require("./storage-manager");

const isMac = () => {
    return process.platform === "darwin";
}

const isDebug = () => {
    return process.argv[2] == "--dev";
}

const quit = () => {
    storageManager.save();
    app.quit();
}

module.exports = {
    isMac: isMac,
    isDebug: isDebug,
    quit: quit
};