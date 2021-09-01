const { app, shell } = require("electron");
const AutoLaunch = require("auto-launch");

const pkg = require("./../../../package.json");
const storageManager = require("./storage-manager");
const eventbusManager = require("./eventbus-manager");

let autoLauncher = null;
let launchAtStartup = false;

const isMac = () => {
    return process.platform === "darwin";
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

eventbusManager.onRendererMessage("openExternal", (url) => {
    shell.openExternal(url);
});

eventbusManager.onRendererInvoke("getVersions", () => {
    const versions = Object.assign({}, process.versions);
    versions.application = pkg.version;
    versions.vue = pkg.dependencies.vue.replace("^", "");
    versions.vueRouter = pkg.dependencies["vue-router"].replace("^", "");
    return versions;
});

module.exports = {
    init: init,
    isLaunchedAtStartup: isLaunchedAtStartup,
    toggleLaunchAtStartup: toggleLaunchAtStartup,
    isMac: isMac,
    isDebug: isDebug,
    quit: quit
};