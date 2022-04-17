const electron = require("electron");
const { app, shell, BrowserWindow, Notification, dialog } = require("electron");
const path = require("path");
const AutoLaunch = require("easy-auto-launch");
const fs = require("fs");
const EventEmitter = require("events");
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

const APPLICATION_ICON = path.join(__dirname, "..", "..", "resources", "images", "icon.png");

const eventEmitter = new EventEmitter();

let autoLauncher = null;
let launchAtStartup = false;
let win = null;
let createWindowFirstTime = true;
let resizeTimeout = null;

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
                icon: APPLICATION_ICON,
                show: false,
                webPreferences: {
                    preload: path.join(__dirname, "..", "electron-preload.js")
                }
            });
            const windowPosition = storageManager.getData("windowPosition", []).value;
            if (windowPosition.length == 2) {
                win.setPosition(windowPosition[0], windowPosition[1]);
            }
            if (devToolsAtLaunch) {
                openDevTools();
            }
            win.loadFile(path.join(__dirname, "..", "..", "renderer", "index.html")).then(() => {
                setMainWindowTouchbar();
                viewManager.showView(viewManager.getCurrentView());
                checkNewVersion();
                if (createWindowFirstTime) {
                    createWindowFirstTime = false;
                    if (isLaunchedMinimized()) {
                        win.close();
                    }
                }
                resolve();
            });
            win.once("ready-to-show", () => {
                win.show();
                eventEmitter.emit("windowStatusChanged", { opened: true });
            });
            win.on("moved", () => {
                if (resizeTimeout != null) {
                    clearTimeout(resizeTimeout);
                }
                resizeTimeout = setTimeout(() => {
                    resizeTimeout = null;
                    storageManager.setData("windowPosition", win.getPosition());
                }, 500);
            });
            win.on("closed", () => {
                win = null;
                eventEmitter.emit("windowStatusChanged", { opened: false });
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
            checkNewVersion();
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
            if (applicationUtils.isWindows()) {
                app.setAppUserModelId(getProductName());
            }
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
    download({
        url: getDownloadUrl(version),
        destination: path.join(app.getPath("temp"), getApplicationFilename(version))
    }).then((destination) => {
        shell.openPath(destination).then(() => {
            quitApplication();
        });
    });
};

function showNotification(title, body) {
    return new Promise((resolve, reject) => {
        if (Notification.isSupported()) {
            const notification = new Notification({
                icon: APPLICATION_ICON,
                title: title,
                body: body
            });
            notification.show();
        }
        setTimeout(() => {
            resolve();
        }, 500);
    });
};

function showConfirmDialog(message) {
    return new Promise((resolve, reject) => {
        const translations = i18nManager.getTranslations(["YES_LABEL", "NO_LABEL"]);
        dialog.showMessageBox(win, {
            cancelId: 1,
            type: "question",
            buttons: [translations["YES_LABEL"], translations["NO_LABEL"]],
            message: message,
            icon: APPLICATION_ICON
        }).then((box) => {
            resolve(box.response == 0);
        });
    });
};

function checkNewVersion(version) {
    if (connectionManager.isOnLine()) {
        download({
            url: "https://raw.githubusercontent.com/uparlange/bing-wallpaper/master/package.json",
            resultDecoder: new TextDecoder("utf-8")
        }).then((res) => {
            const github = JSON.parse(res);
            const applicationVersion = version ? version : pkg.version;
            if (compareVersion(github.version, applicationVersion) > 0) {
                const translations = i18nManager.getTranslations([
                    "INFORMATION_LABEL", "NEW_VERSION_AVAILABLE_LABEL", "DO_YOU_WANT_TO_INSTALL_LABEL"], { version: github.version });
                showNotification(translations["INFORMATION_LABEL"], translations["NEW_VERSION_AVAILABLE_LABEL"]).then(() => {
                    const message = translations["NEW_VERSION_AVAILABLE_LABEL"] + ". " + translations["DO_YOU_WANT_TO_INSTALL_LABEL"];
                    showConfirmDialog(message).then((confirm) => {
                        if (confirm) {
                            updateApplication(github.version);
                        }
                    });
                });
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

function openPath(path) {
    shell.openPath(path);
};

function onWindowStatusChanged(callback) {
    eventEmitter.on("windowStatusChanged", callback);
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
    openPath: openPath,
    createWindow: createWindow,
    quitApplication: quitApplication,
    download: download,
    openDevTools: openDevTools,
    checkNewVersion: checkNewVersion,
    showNotification: showNotification,
    showConfirmDialog: showConfirmDialog,
    onWindowStatusChanged: onWindowStatusChanged
};