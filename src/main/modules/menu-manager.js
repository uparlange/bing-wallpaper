const { Menu, BrowserWindow, app } = require("electron");

const applicationManager = require("./application-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const viewManager = require("./view-manager");

const changeMenuItemChecked = (menuItemId, checked) => {
    Menu.getApplicationMenu().getMenuItemById(menuItemId).checked = checked;
};

const setActiveMenuItemOfList = (menuItemIds, activeMenuItemId) => {
    menuItemIds.forEach((menuItemId) => {
        changeMenuItemChecked(menuItemId, menuItemId == activeMenuItemId);
    });
};

const refresh = () => {
    const translations = i18nManager.getTranslations([
        "DEBUG_LABEL", "SET_BING_WALLPAPER_LABEL", "QUIT_LABEL",
        "VIEW_LABEL", "WALLPAPER_LABEL", "ABOUT_LABEL",
        "LANGUAGE_LABEL", "FRENCH_LABEL", "ENGLISH_LABEL",
        "PREFERENCES_LABEL", "LAUNCH_AT_STARTUP_LABEL"]);
    const template = [
        {
            label: applicationManager.isMac() ? app.getName() : "Application",
            submenu: [
                {
                    label: translations["DEBUG_LABEL"],
                    visible: applicationManager.isDebug(),
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
                        applicationManager.quit();
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
                        setActiveMenuItemOfList(["MENU_ITEM_WALLPAPER_ID", "MENU_ITEM_ABOUT_ID"], "MENU_ITEM_WALLPAPER_ID");
                        viewManager.showView(viewManager.WALLPAPER_VIEW);
                    }
                }, {
                    id: "MENU_ITEM_ABOUT_ID",
                    label: translations["ABOUT_LABEL"],
                    checked: viewManager.getCurrentView() == viewManager.ABOUT_VIEW,
                    type: "checkbox",
                    click: () => {
                        setActiveMenuItemOfList(["MENU_ITEM_WALLPAPER_ID", "MENU_ITEM_ABOUT_ID"], "MENU_ITEM_ABOUT_ID");
                        viewManager.showView(viewManager.ABOUT_VIEW);
                    }
                }
            ]
        },
        {
            label: translations["PREFERENCES_LABEL"],
            submenu: [
                {
                    id: "MENU_ITEM_LAUNCH_AT_STARTUP_ID",
                    label: translations["LAUNCH_AT_STARTUP_LABEL"],
                    checked: applicationManager.isLaunchedAtStartup(),
                    type: "checkbox",
                    click: () => {
                        changeMenuItemChecked("MENU_ITEM_LAUNCH_AT_STARTUP_ID", applicationManager.toggleLaunchAtStartup());
                    }
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
                                setActiveMenuItemOfList(["MENU_ITEM_FRENCH_ID", "MENU_ITEM_ENGLISH_ID"], "MENU_ITEM_FRENCH_ID");
                                i18nManager.setLanguage("fr");
                            }
                        }, {
                            id: "MENU_ITEM_ENGLISH_ID",
                            label: translations["ENGLISH_LABEL"],
                            checked: i18nManager.getCurrentLanguage() == "en",
                            type: "checkbox",
                            click: () => {
                                setActiveMenuItemOfList(["MENU_ITEM_FRENCH_ID", "MENU_ITEM_ENGLISH_ID"], "MENU_ITEM_FRENCH_ID");
                                i18nManager.setLanguage("en");
                            }
                        }
                    ]
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