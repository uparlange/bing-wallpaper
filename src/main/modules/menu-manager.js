const { Menu, BrowserWindow, app } = require("electron");

const applicationUtils = require("./application-utils");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const viewManager = require("./view-manager");

const setActiveCheckbox = (list, active) => {
    list.forEach((element) => {
        Menu.getApplicationMenu().getMenuItemById(element).checked = (element == active);
    });
};

const refresh = () => {
    const translations = i18nManager.getTranslations([
        "DEBUG_LABEL", "SET_BING_WALLPAPER_LABEL", "QUIT_LABEL",
        "VIEW_LABEL", "WALLPAPER_LABEL", "ABOUT_LABEL",
        "LANGUAGE_LABEL", "FRENCH_LABEL", "ENGLISH_LABEL"]);
    const template = [
        {
            label: applicationUtils.isMac() ? app.getName() : "Application",
            submenu: [
                {
                    label: translations["DEBUG_LABEL"],
                    visible: applicationUtils.isDebug(),
                    click: () => {
                        const win = BrowserWindow.getAllWindows()[0];
                        if (win != null) {
                            win.webContents.openDevTools();
                        }
                    }
                },
                {
                    label: translations["SET_BING_WALLPAPER_LABEL"],
                    click: () => {
                        wallpaperManager.setBingWallpaper();
                    }
                },
                { type: "separator" },
                {
                    label: translations["QUIT_LABEL"],
                    click: () => {
                        applicationUtils.quit();
                    }
                }
            ]
        },
        {
            label: translations["VIEW_LABEL"],
            submenu: [
                {
                    id: "MENU_ITEM_WALLPAPER_ID",
                    label: translations["WALLPAPER_LABEL"],
                    checked: viewManager.getCurrentView() == viewManager.WALLPAPER_VIEW,
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_WALLPAPER_ID", "MENU_ITEM_ABOUT_ID"], "MENU_ITEM_WALLPAPER_ID");
                        viewManager.showView(viewManager.WALLPAPER_VIEW);
                    }
                }, {
                    id: "MENU_ITEM_ABOUT_ID",
                    label: translations["ABOUT_LABEL"],
                    checked: viewManager.getCurrentView() == viewManager.ABOUT_VIEW,
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_WALLPAPER_ID", "MENU_ITEM_ABOUT_ID"], "MENU_ITEM_ABOUT_ID");
                        viewManager.showView(viewManager.ABOUT_VIEW);
                    }
                }
            ]
        },
        {
            label: translations["LANGUAGE_LABEL"],
            submenu: [
                {
                    id: "MENU_ITEM_FRENCH_ID",
                    label: translations["FRENCH_LABEL"],
                    checked: i18nManager.getCurrentLanguage() == "fr",
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_FRENCH_ID", "MENU_ITEM_ENGLISH_ID"], "MENU_ITEM_FRENCH_ID");
                        i18nManager.setLanguage("fr");
                    }
                }, {
                    id: "MENU_ITEM_ENGLISH_ID",
                    label: translations["ENGLISH_LABEL"],
                    checked: i18nManager.getCurrentLanguage() == "en",
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_FRENCH_ID", "MENU_ITEM_ENGLISH_ID"], "MENU_ITEM_FRENCH_ID");
                        i18nManager.setLanguage("en");
                    }
                }
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

const init = () => {
    refresh();
    i18nManager.onLanguageChanged(() => {
        refresh();
    });
};

module.exports = {
    init: init
};