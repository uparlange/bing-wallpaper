const i18next = require("i18next");
const LanguageDetector = require("i18next-electron-language-detector");
const backend = require("i18next-fs-backend");
const path = require("path");
const EventEmitter = require("events");

const applicationManager = require("./application-manager");
const storageManager = require("./storage-manager");
const eventbusManager = require("./eventbus-manager");
const loggerManager = require("./logger-manager");

const eventEmitter = new EventEmitter();

const availableLanguages = ["fr", "en", "es"];

const init = () => {
    return new Promise((resolve, reject) => {
        i18next.use(LanguageDetector).use(backend).init({
            backend: {
                loadPath: path.join(__dirname, "..", "..", "resources", "locales", "{{lng}}", "{{ns}}.json"),
                addPath: path.join(__dirname, "..", "..", "resources", "locales", "{{lng}}", "{{ns}}.missing.json")
            },
            supportedLngs: availableLanguages,
            fallbackLng: "en",
            debug: applicationManager.isDebug()
        });
        i18next.on("initialized", (options) => {
            setLanguage(getCurrentLanguage()).then(() => {
                loggerManager.getLogger().info("I18nManager - Init : OK");
                resolve();
            });
        });
        i18next.on("languageChanged", (lng) => {
            eventEmitter.emit("languageChanged", lng);
            eventbusManager.sendRendererMessage("languageChanged", lng);
        });
    });
};

const onLanguageChanged = (callback) => {
    eventEmitter.on("languageChanged", callback);
};

const getCurrentLanguage = () => {
    return storageManager.getData("language", i18next.language.split("-")[0]).value;
};

const setLanguage = (lng) => {
    return new Promise((resolve, reject) => {
        storageManager.setData("language", lng);
        i18next.changeLanguage(lng).then((t) => {
            resolve();
        });
    });
};

const getTranslations = (keyList, options) => {
    const translations = {};
    keyList.forEach((key) => {
        translations[key] = i18next.t(key, options);
    });
    return translations;
};

const getAvailableLanguages = () => {
    return availableLanguages;
};

module.exports = {
    init: init,
    getAvailableLanguages: getAvailableLanguages,
    getTranslations: getTranslations,
    getCurrentLanguage: getCurrentLanguage,
    setLanguage: setLanguage,
    onLanguageChanged: onLanguageChanged
};