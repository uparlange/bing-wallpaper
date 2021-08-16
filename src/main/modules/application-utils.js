const { app } = require("electron");

const isMac = () => {
    return process.platform === "darwin";
}

const isDebug = () => {
    return process.env.DEBUG === "true";
}

module.exports = {
    isMac: isMac,
    isDebug: isDebug
};