const { app, shell, BrowserWindow } = require("electron");
const path = require("path");
const AutoLaunch = require("auto-launch");

const pkg = require("./../../../package.json");
const storageManager = require("./storage-manager");
const viewManager = require("./view-manager");

let autoLauncher = null;
let launchAtStartup = false;
let win = null;

const isMac = () => {
    return process.platform === "darwin";
};

const isWindows = () => {
    return process.platform === "win32";
};

const isDebug = () => { 
    return process.argv[2] == "--dev";
};

const quit = () => {
    storageManager.save();
    app.quit();
};

const isLaunchedAtStartup = () => {
    return launchAtStartup;
};

const toggleLaunchAtStartup = () => {
    launchAtStartup = !launchAtStartup;
    if (launchAtStartup) {
        autoLauncher.enable();
    } else {
        autoLauncher.disable();
    }
    return launchAtStartup;
};

const createWindow = () => {
    return new Promise((resolve, reject) => {
        if (BrowserWindow.getAllWindows().length === 0) {
            win = new BrowserWindow({
                width: 640,
                height: 400,
                resizable: isDebug(),
                icon: path.join(__dirname, "..", "..", "resources", "images", "icon.png"),
                webPreferences: {
                    preload: path.join(__dirname, "..", "electron-preload.js")
                }
            });
            win.loadFile(path.join(__dirname, "..", "..", "renderer", "index.html")).then(() => {
                viewManager.showView(viewManager.getCurrentView());
                resolve();
            });
            win.on("closed", () => {
                win = null;
            });
        } else {
            setTimeout(() => {
                resolve();
            });
        }
    });
};

const init = () => {
    return new Promise((resolve, reject) => {
        autoLauncher = new AutoLaunch({ name: app.getName() });
        autoLauncher.isEnabled().then((isEnabled) => {
            launchAtStartup = isEnabled;
            resolve();
        }).catch((err) => {
            loggerManager.getLogger().error("ApplicationManager - Init : " + err);
        });
    });
};

const openExternal = (url) => {
    shell.openExternal(url);
};

const getVersions = () => {
    const versions = Object.assign({}, process.versions);
    versions.application = pkg.version;
    versions.vue = pkg.dependencies.vue.replace("^", "");
    versions.vueRouter = pkg.dependencies["vue-router"].replace("^", "");
    return versions;
};

module.exports = {
    openExternal: openExternal,
    getVersions: getVersions,
    init: init,
    isLaunchedAtStartup: isLaunchedAtStartup,
    toggleLaunchAtStartup: toggleLaunchAtStartup,
    isMac: isMac,
    isWindows: isWindows,
    isDebug: isDebug,
    quit: quit,
    createWindow: createWindow
};