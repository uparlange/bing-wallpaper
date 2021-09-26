function isMac() {
    return process.platform === "darwin";
};

function isWindows() {
    return process.platform === "win32";
};

function isDebug() {
    return process.argv[2] == "--dev";
};

function getLabelKey(name, type) {
    return name + "_" + type + "_LABEL";
};

module.exports = {
    isMac: isMac,
    isWindows: isWindows,
    isDebug: isDebug,
    getLabelKey: getLabelKey
};