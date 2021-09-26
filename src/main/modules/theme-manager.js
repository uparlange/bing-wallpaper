const { nativeTheme } = require("electron");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const storageManager = require("./storage-manager");

const eventEmitter = new EventEmitter();

function init() {
    setTheme(getCurrentTheme());
    loggerManager.getLogger().info("ThemeManager - Init : OK");
};

function getAvailableThemes() {
    return ["system", "light", "dark"];
};

function getCurrentTheme() {
    return storageManager.getData("theme", nativeTheme.themeSource).value;
};

function setTheme(theme) {
    storageManager.setData("theme", theme);
    nativeTheme.themeSource = theme;
    const message = {
        theme: theme
    };
    eventEmitter.emit("themeChanged", message);
};

function onThemeChanged(callback) {
    eventEmitter.on("themeChanged", callback);
};

module.exports = {
    init: init,
    getAvailableThemes: getAvailableThemes,
    getCurrentTheme: getCurrentTheme,
    setTheme: setTheme,
    onThemeChanged: onThemeChanged
};