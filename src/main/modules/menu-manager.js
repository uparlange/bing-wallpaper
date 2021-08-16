const { app, Menu, BrowserWindow } = require("electron");

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
    const template = [
        {
            label: app.getName(),
            submenu: [
                {
                    label: i18nManager.getTranslation("SET_BING_WALLPAPER_LABEL"),
                    click: () => {
                        wallpaperManager.setBingWallpaper();
                    }
                },
                { type: "separator" },
                {
                    label: i18nManager.getTranslation("DEBUG_LABEL"),
                    visible: applicationUtils.isDebug(),
                    click: () => {
                        const win = BrowserWindow.getAllWindows()[0];
                        if (win != null) {
                            win.webContents.openDevTools();
                        }
                    }
                },
                { type: "separator" },
                {
                    label: i18nManager.getTranslation("QUIT_LABEL"),
                    click: () => {
                        applicationUtils.quit();
                    }
                }
            ]
        },
        {
            label: i18nManager.getTranslation("VIEW_LABEL"),
            submenu: [
                {
                    id: "MENU_ITEM_WALLPAPER_ID",
                    label: i18nManager.getTranslation("WALLPAPER_LABEL"),
                    checked: viewManager.getCurrentView() == viewManager.WALLPAPER_VIEW,
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_WALLPAPER_ID", "MENU_ITEM_ABOUT_ID"], "MENU_ITEM_WALLPAPER_ID");
                        viewManager.showView(viewManager.WALLPAPER_VIEW);
                    }
                }, {
                    id: "MENU_ITEM_ABOUT_ID",
                    label: i18nManager.getTranslation("ABOUT_LABEL"),
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
            label: i18nManager.getTranslation("LANGUAGE_LABEL"),
            submenu: [
                {
                    id: "MENU_ITEM_FRENCH_ID",
                    label: i18nManager.getTranslation("FRENCH_LABEL"),
                    checked: i18nManager.getCurrentLanguage() == "fr",
                    type: "checkbox",
                    click: () => {
                        setActiveCheckbox(["MENU_ITEM_FRENCH_ID", "MENU_ITEM_ENGLISH_ID"], "MENU_ITEM_FRENCH_ID");
                        i18nManager.setLanguage("fr");
                    }
                }, {
                    id: "MENU_ITEM_ENGLISH_ID",
                    label: i18nManager.getTranslation("ENGLISH_LABEL"),
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
    return new Promise((resolve, reject) => {
        refresh();
        i18nManager.onLanguageChanged(() => {
            refresh();
        });
        setTimeout(() => {
            resolve();
        });
    });
};

module.exports = {
    init: init
};