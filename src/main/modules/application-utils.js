function isMac() {
    return process.platform === "darwin";
};

function isWindows() {
    return process.platform === "win32";
};

function isDebug() {
    return process.argv[2] == "--dev";
};

module.exports = {
    isMac: isMac,
    isWindows: isWindows,
    isDebug: isDebug
};