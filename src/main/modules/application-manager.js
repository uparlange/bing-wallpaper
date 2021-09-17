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

const getMainWindow = () => {
    return win;
};

const getProductName = () => {
    return pkg.description;
};

const quitApplication = () => {
    storageManager.save();
    app.quit();
};

const isLaunchedMinimized = () => {
    return storageManager.getData("launchMinimized", false).value;
};

const toggleLaunchMinimized = () => {
    const launchMinimized = !isLaunchedMinimized();
    storageManager.setData("launchMinimized", launchMinimized);
    return launchMinimized;
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

const createWindow = (devToolsAtLaunch) => {
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
            if(devToolsAtLaunch) {
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

const setMainWindowTouchbar = (forceRefresh) => {
    if (win != null) {
        win.setTouchBar(touchbarManager.getTouchbar(forceRefresh));
    }
};

const init = () => {
    return new Promise((resolve, reject) => {
        initAutoLauncher().then(initAutoUpdater).then(() => {
            i18nManager.onLanguageChanged((lng) => {
                setMainWindowTouchbar(true);
            });
            viewManager.onViewChanged((view) => {
                setMainWindowTouchbar(true);
            });
            loggerManager.getLogger().info("ApplicationManager - Init : OK");
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
    // process.arch always ia32 even in 64 bit platform ?
    // manage only x64 version so force to x64
    const arch = process.arch == "ia32" ? "x64" : process.arch;
    return `${getProductName()}-${version}-${arch}.${applicationUtils.isMac() ? "dmg" : "exe"}`;
};

const showStreamProgress = (stream) => {
    stream.on("downloadProgress", (progress) => {
        eventbusManager.sendRendererMessage("downloadProgress", progress);
        if (win != null) {
            win.setProgressBar((progress.percent == 1) ? -1 : progress.percent);
        }
    });
};

const download = (url, destination) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("ApplicationManager - download '" + url + "' to '" + destination + "'");
        const ws = fs.createWriteStream(destination);
        ws.on("finish", () => {
            resolve(destination);
        });
        const stream = _download(url);
        stream.pipe(ws);
        showStreamProgress(stream);
    });
};

const fetch = (url) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("ApplicationManager - fetch '" + url + "'");
        const stream = _download(url);
        stream.then((data) => {
            resolve(new TextDecoder("utf-8").decode(data));
        });
        showStreamProgress(stream);
    });
};

const updateApplication = (version) => {
    const destination = path.join(app.getPath("temp"), getApplicationFilename(version));
    download(getDownloadUrl(version), destination).then((destination) => {
        shell.openPath(destination).then(() => {
            quitApplication();
        })
    });
};

const checkForUpdates = () => {
    if (connectionManager.isOnLine()) {
        fetch("https://raw.githubusercontent.com/uparlange/bing-wallpaper/master/package.json").then((res) => {
            const json = JSON.parse(res);
            if (compareVersion(json.version, pkg.version) > 0) {
                eventbusManager.sendRendererMessage("newVersionAvailable", json.version);
            } else {
                loggerManager.getLogger().info("ApplicationManager - No new version available");
            }
        });
    }
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

const openDevTools = () => {
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
    fetch: fetch,
    openDevTools: openDevTools
};