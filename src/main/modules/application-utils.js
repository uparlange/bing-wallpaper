const isMac = () => {
    return process.platform === "darwin";
};

const isWindows = () => {
    return process.platform === "win32";
};

const isDebug = () => {
    return process.argv[2] == "--dev";
};

module.exports = {
    isMac: isMac,
    isWindows: isWindows,
    isDebug: isDebug
};