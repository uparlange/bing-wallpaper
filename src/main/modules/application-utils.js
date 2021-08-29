const { app, shell } = require("electron");

const pkg = require("./../../../package.json");
const storageManager = require("./storage-manager");
const eventbusManager = require("./eventbus-manager");

const isMac = () => {
    return process.platform === "darwin";
}

const isDebug = () => {
    return process.argv[2] == "--dev";
}

const quit = () => {
    storageManager.save();
    app.quit();
}

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
    isMac: isMac,
    isDebug: isDebug,
    quit: quit
};