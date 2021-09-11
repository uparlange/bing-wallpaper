const electron = require("electron");
const { app, shell, BrowserWindow, Notification } = require("electron");
const path = require("path");
const AutoLaunch = require("auto-launch");
const fetch = require("node-fetch");
const fs = require("fs");
const download = require("download");

const pkg = require("./../../../package.json");
const storageManager = require("./storage-manager");
const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const connectionManager = require("./connection-manager");

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
                checkForUpdates();
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

const initAutoLauncher = () => {
    return new Promise((resolve, reject) => {
        autoLauncher = new AutoLaunch({ name: app.getName() });
        autoLauncher.isEnabled().then((isEnabled) => {
            launchAtStartup = isEnabled;
            resolve();
        }).catch((err) => {
            loggerManager.getLogger().error("ApplicationManager - initAutoLauncher : " + err);
            resolve();
        });
    });
};

const initAutoUpdater = () => {
    return new Promise((resolve, reject) => {
        electron.powerMonitor.on("unlock-screen", () => {
            checkForUpdates();
        });
        resolve();
    });
};

const init = () => {
    return new Promise((resolve, reject) => {
        initAutoLauncher().then(initAutoUpdater).then(() => {
            resolve();
        });
    });
};

const compareVersion = (v1, v2) => {
    if (typeof v1 !== 'string') return false;
    if (typeof v2 !== 'string') return false;
    v1 = v1.split('.');
    v2 = v2.split('.');
    const k = Math.min(v1.length, v2.length);
    for (let i = 0; i < k; ++i) {
        v1[i] = parseInt(v1[i], 10);
        v2[i] = parseInt(v2[i], 10);
        if (v1[i] > v2[i]) return 1;
        if (v1[i] < v2[i]) return -1;
    }
    return v1.length == v2.length ? 0 : (v1.length < v2.length ? -1 : 1);
};

const getDownloadUrl = (version) => {
    return `https://github.com/uparlange/bing-wallpaper/releases/download/v${version}/${getApplicationFilename(version)}`;
};

const getApplicationFilename = (version) => {
    return `${pkg.build.productName}-${version}-${process.arch}.${isMac() ? "dmg" : "exe"}`;
};

const downloadVersion = (url, destination) => {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(destination);
        ws.on("finish", () => {
            resolve(destination);
        });
        loggerManager.getLogger().info("ApplicationManager - Download application '" + url + "' to '" + destination + "'");
        download(url).pipe(ws);
    });
};

const updateApplication = (version) => {
    const destination = path.join(app.getPath("temp"), getApplicationFilename(version));
    downloadVersion(getDownloadUrl(version), destination).then((destination) => {
        shell.openPath(destination).then(() => {
            quit();
        })
    });
};

const checkForUpdates = () => {
    if (connectionManager.isOnLine()) {
        fetch("https://raw.githubusercontent.com/uparlange/bing-wallpaper/master/package.json").then(res => res.json()).then(json => {
            if (compareVersion(json.version, pkg.version) > 0) {
                eventbusManager.sendRendererMessage("newVersionAvailable", json.version);
            } else {
                loggerManager.getLogger().info("ApplicationManager - No new version available");
            }
        });
    };
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
    createWindow: createWindow,
    updateApplication: updateApplication
};