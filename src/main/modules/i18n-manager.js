import i18next from "i18next";
import LanguageDetector from "i18next-electron-language-detector";
import backend from "i18next-fs-backend";
import path from "path";
import EventEmitter from "events";

import applicationUtils from "./application-utils";
import storageManager from "./storage-manager";
import eventbusManager from "./eventbus-manager";
import loggerManager from "./logger-manager";

const eventEmitter = new EventEmitter();
const availableLanguages = ["fr", "en", "es"];

function getLabelKey(lng) {
    return lng.toUpperCase() + "_LANGUAGE_LABEL";
};

function getMessage(lng) {
    return {
        lng: lng,
        labelKey: getLabelKey(lng),
        current: getCurrentLanguage() == lng
    };
};

function init() {
    return new Promise((resolve, reject) => {
        i18next.use(LanguageDetector).use(backend).init({
            backend: {
                loadPath: path.join(__dirname, "resources", "locales", "{{lng}}", "{{ns}}.json"),
                addPath: path.join(__dirname, "resources", "locales", "{{lng}}", "{{ns}}.missing.json")
            },
            supportedLngs: availableLanguages,
            fallbackLng: "en",
            debug: applicationUtils.isDebug()
        });
        i18next.on("initialized", (options) => {
            setLanguage(getCurrentLanguage()).then(() => {
                loggerManager.getLogger().info("I18nManager - Init : OK");
                resolve();
            });
        });
        i18next.on("languageChanged", (lng) => {
            const message = getMessage(lng);
            eventEmitter.emit("languageChanged", message);
            eventbusManager.sendRendererMessage("languageChanged", message);
        });
    });
};

function onLanguageChanged(callback) {
    eventEmitter.on("languageChanged", callback);
};

function getCurrentLanguage() {
    return storageManager.getData("language", i18next.language.split("-")[0]).value;
};

function setNextLanguage() {
    const index = availableLanguages.findIndex((element) => element == getCurrentLanguage());
    const nextLanguage = (index < (availableLanguages.length - 1)) ? availableLanguages[index + 1] : availableLanguages[0];
    setLanguage(nextLanguage);
};

function setLanguage(lng) {
    return new Promise((resolve, reject) => {
        storageManager.setData("language", lng);
        i18next.changeLanguage(lng).then((t) => {
            resolve();
        });
    });
};

function getTranslations(keyList, options) {
    const translations = {};
    keyList.forEach((key) => {
        translations[key] = i18next.t(key, options);
    });
    return translations;
};

function getAvailableLanguages() {
    return availableLanguages.map((lng) => {
        return getMessage(lng);
    });
};

export default {
    init: init,
    getAvailableLanguages: getAvailableLanguages,
    getTranslations: getTranslations,
    getCurrentLanguage: getCurrentLanguage,
    setLanguage: setLanguage,
    setNextLanguage: setNextLanguage,
    onLanguageChanged: onLanguageChanged
};