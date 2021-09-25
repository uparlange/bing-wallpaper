const { nativeTheme } = require("electron");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const storageManager = require("./storage-manager");

const eventEmitter = new EventEmitter();

const init = () => {
    setTheme(getCurrentTheme());
    loggerManager.getLogger().info("ThemeManager - Init : OK");
};

const getAvailableThemes = () => {
    return ["system", "light", "dark"];
};

const getCurrentTheme = () => {
    return storageManager.getData("theme", nativeTheme.themeSource).value;
};

const setTheme = (theme) => {
    storageManager.setData("theme", theme);
    nativeTheme.themeSource = theme;
    const message = {
        theme: theme
    };
    eventEmitter.emit("themeChanged", message);
};

const onThemeChanged = (callback) => {
    eventEmitter.on("themeChanged", callback);
};

module.exports = {
    init: init,
    getAvailableThemes: getAvailableThemes,
    getCurrentTheme: getCurrentTheme,
    setTheme: setTheme,
    onThemeChanged: onThemeChanged
};