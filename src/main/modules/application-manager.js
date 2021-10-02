const electron = require("electron");
const { app, shell, BrowserWindow } = require("electron");
const path = require("path");
const AutoLaunch = require("auto-launch");
const fs = require("fs");
const _download = require("download");

const pkg = require("./../../../package.json");
const storageManager = require("./storage-manager");
const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const connectionManager = require("./connection-manager");
const touchbarManager = require("./touchbar-manager");
const i18nManager = require("./i18n-manager");
const applicationUtils = require("./application-utils");

let autoLauncher = null;
let launchAtStartup = false;
let win = null;
let createWindowFirstTime = true;

function getMainWindow() {
    return win;
};

function getProductName() {
    return pkg.description;
};

function quitApplication() {
    storageManager.save();
    app.quit();
};

function isLaunchedMinimized() {
    return storageManager.getData("launchMinimized", false).value;
};

function toggleLaunchMinimized() {
    const launchMinimized = !isLaunchedMinimized();
    storageManager.setData("launchMinimized", launchMinimized);
    return launchMinimized;
};

function isLaunchedAtStartup() {
    return launchAtStartup;
};

function toggleLaunchAtStartup() {
    launchAtStartup = !launchAtStartup;
    if (launchAtStartup) {
        autoLauncher.enable();
    } else {
        autoLauncher.disable();
    }
    return launchAtStartup;
};

function createWindow(devToolsAtLaunch) {
    return new Promise((resolve, reject) => {
        if (win == null) {
            win = new BrowserWindow({
                width: 640,
                height: 400,
                resizable: applicationUtils.isDebug(),
                icon: path.join(__dirname, "..", "..", "resources", "images", "icon.png"),
                webPreferences: {
                    preload: path.join(__dirname, "..", "electron-preload.js")
                }
            });
            if (devToolsAtLaunch) {
                openDevTools();
            }
            win.loadFile(path.join(__dirname, "..", "..", "renderer", "index.html")).then(() => {
                setMainWindowTouchbar();
                viewManager.showView(viewManager.getCurrentView());
                checkForUpdates();
                if (createWindowFirstTime) {
                    createWindowFirstTime = false;
                    if (isLaunchedMinimized()) {
                        win.close();
                    }
                }
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

function initAutoLauncher() {
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

function initAutoUpdater() {
    return new Promise((resolve, reject) => {
        electron.powerMonitor.on("unlock-screen", () => {
            checkForUpdates();
        });
        resolve();
    });
};

function setMainWindowTouchbar(forceRefresh) {
    if (win != null) {
        win.setTouchBar(touchbarManager.getTouchbar(forceRefresh));
    }
};

function init() {
    return new Promise((resolve, reject) => {
        initAutoLauncher().then(initAutoUpdater).then(() => {
            i18nManager.onLanguageChanged((message) => {
                setMainWindowTouchbar(true);
            });
            viewManager.onViewChanged((message) => {
                setMainWindowTouchbar(true);
            });
            loggerManager.getLogger().info("ApplicationManager - Init : OK");
            resolve();
        });
    });
};

function compareVersion(v1, v2) {
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

function getDownloadUrl(version) {
    return `https://github.com/uparlange/bing-wallpaper/releases/download/v${version}/${getApplicationFilename(version)}`;
};

function getApplicationFilename(version) {
    // process.arch always ia32 even in 64 bit platform ?
    // manage only x64 version so force to x64
    const arch = process.arch == "ia32" ? "x64" : process.arch;
    return `${getProductName()}-${version}-${arch}.${applicationUtils.isMac() ? "dmg" : "exe"}`;
};

function showDownloadProgress(value) {
    const message = {
        progress: (value == 1) ? 0 : value
    };
    eventbusManager.sendRendererMessage("downloadProgress", message);
    if (win != null) {
        win.setProgressBar(value == 1 ? -1 : value);
    }
};

function download(params) {
    return new Promise((resolve, reject) => {
        let logMessage = "ApplicationManager - download '" + params.url + "'";
        if (params.destination != null) {
            logMessage += " to '" + params.destination + "'";
        }
        loggerManager.getLogger().info(logMessage);
        /*
        const stream = _download(params.url, {
            rejectUnauthorized: false
        });
        */
        const stream = _download(params.url);
        stream.on("downloadProgress", (progress) => {
            showDownloadProgress(progress.percent);
        });
        stream.then((data) => {
            showDownloadProgress(1);
            if (params.destination != null) {
                fs.writeFileSync(params.destination, data);
                resolve(params.destination);
            } else {
                if (params.resultDecoder != null) {
                    data = params.resultDecoder.decode(data);
                }
                resolve(data);
            }
        }).catch((err) => {
            loggerManager.getLogger().error("ApplicationManager - download : " + err);
            showDownloadProgress(1);
            resolve(null);
        });
    });
};

function updateApplication(version) {
    const destination = path.join(app.getPath("temp"), getApplicationFilename(version));
    download(getDownloadUrl(version), destination).then((destination) => {
        shell.openPath(destination).then(() => {
            quitApplication();
        })
    });
};

function checkForUpdates() {
    if (connectionManager.isOnLine()) {
        download({
            url: "https://raw.githubusercontent.com/uparlange/bing-wallpaper/master/package.json",
            resultDecoder: new TextDecoder("utf-8")
        }).then((res) => {
            const json = JSON.parse(res);
            if (compareVersion(json.version, pkg.version) > 0) {
                const message = {
                    version: json.version
                };
                eventbusManager.sendRendererMessage("newVersionAvailable", message);
            } else {
                loggerManager.getLogger().info("ApplicationManager - No new version available");
            }
        });
    }
};

function openExternal(url) {
    shell.openExternal(url);
};

function getVersions() {
    const versions = Object.assign({}, process.versions);
    versions.application = pkg.version;
    versions.vue = pkg.dependencies.vue.replace("^", "");
    versions.vueRouter = pkg.dependencies["vue-router"].replace("^", "");
    return versions;
};

function openDevTools() {
    if (win != null) {
        win.webContents.openDevTools();
    }
};

module.exports = {
    init: init,
    getVersions: getVersions,
    getMainWindow: getMainWindow,
    getProductName: getProductName,
    isLaunchedMinimized: isLaunchedMinimized,
    isLaunchedAtStartup: isLaunchedAtStartup,
    toggleLaunchMinimized: toggleLaunchMinimized,
    toggleLaunchAtStartup: toggleLaunchAtStartup,
    openExternal: openExternal,
    createWindow: createWindow,
    quitApplication: quitApplication,
    updateApplication: updateApplication,
    download: download,
    openDevTools: openDevTools
};