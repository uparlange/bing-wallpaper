const { nativeTheme } = require("electron");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const storageManager = require("./storage-manager");

const eventEmitter = new EventEmitter();
const themes = ["system", "light", "dark"];

function getLabelKey(theme) {
    return theme.toUpperCase() + "_THEME_LABEL";
};

function getMessage(theme) {
    return {
        theme: theme,
        labelKey: getLabelKey(theme),
        current: getCurrentTheme() == theme
    };
};

function init() {
    setTheme(getCurrentTheme());
    loggerManager.getLogger().info("ThemeManager - Init : OK");
};

function getAvailableThemes() {
    return themes.map((theme) => {
        return getMessage(theme);
    });
};

function getCurrentTheme() {
    return storageManager.getData("theme", nativeTheme.themeSource).value;
};

function setNextTheme() {
    const index = themes.findIndex((element) => element == getCurrentTheme());
    const nextTheme = (index < (themes.length - 1)) ? themes[index + 1] : themes[0];
    setTheme(nextTheme);
};

function setTheme(theme) {
    storageManager.setData("theme", theme);
    nativeTheme.themeSource = theme;
    eventEmitter.emit("themeChanged", getMessage(theme));
};

function onThemeChanged(callback) {
    eventEmitter.on("themeChanged", callback);
};

module.exports = {
    init: init,
    getAvailableThemes: getAvailableThemes,
    getCurrentTheme: getCurrentTheme,
    setTheme: setTheme,
    setNextTheme: setNextTheme,
    onThemeChanged: onThemeChanged
};