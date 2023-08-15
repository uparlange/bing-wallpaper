function isMac() {
    return process.platform === "darwin";
};

function isWindows() {
    return process.platform === "win32";
};

function isDebug() {
    return process.argv[2] == "--dev";
};

export default {
    isMac: isMac,
    isWindows: isWindows,
    isDebug: isDebug
};