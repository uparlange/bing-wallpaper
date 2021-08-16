const i18next = require("i18next");
const LanguageDetector = require("i18next-electron-language-detector");
const backend = require("i18next-fs-backend");
const path = require("path");
const EventEmitter = require("events");

const applicationUtils = require("./application-utils");
const storageManager = require("./storage-manager");

const eventEmitter = new EventEmitter();

const init = () => {
    return new Promise((resolve, reject) => {
        i18next.use(LanguageDetector).use(backend).init({
            backend: {
                loadPath: path.join(__dirname, "locales", "{{lng}}", "{{ns}}.json"),
                addPath: path.join(__dirname, "locales", "{{lng}}", "{{ns}}.missing.json")
            },
            fallbackLng: "en",
            debug: applicationUtils.isDebug()
        });
        i18next.on("initialized", function (options) {
            setLanguage(getCurrentLanguage());
            resolve();
        });
        i18next.on("languageChanged", function (lng) {
            eventEmitter.emit("languageChanged", lng);
        });
    });
};

const onLanguageChanged = (callback) => {
    eventEmitter.on("languageChanged", callback);
};

const getTranslation = (keys, options) => {
    return i18next.t(keys, options);
};

const getCurrentLanguage = () => {
    return storageManager.getData("language", i18next.language).value;
};

const setLanguage = (lng) => {
    storageManager.setData("language", lng);
    i18next.changeLanguage(lng);
};

module.exports = {
    init: init,
    getTranslation: getTranslation,
    getCurrentLanguage: getCurrentLanguage,
    setLanguage: setLanguage,
    onLanguageChanged: onLanguageChanged
};