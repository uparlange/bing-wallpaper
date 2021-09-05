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

const getMenuItemId = (name) => {
    return "MENU_ITEM_" + name + "_ID";
};

const getMenuItemLabelKey = (name, type) => {
    return name + "_" + type + "_LABEL";
};

const getAvailableWallpaperSources = () => {
    const availableWallpaperSources = [];
    wallpaperManager.getAvailableWallpaperSources().forEach(source => {
        const menuItemName = source.toUpperCase();
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = getMenuItemLabelKey(menuItemName, "WALLPAPER_SOURCE");
        availableWallpaperSources.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: wallpaperManager.getCurrentWallpaperSource() == source,
            type: "checkbox",
            click: () => {
                setActiveMenuItemOfList(wallpaperManager.getAvailableWallpaperSources().map((element) => {
                    return getMenuItemId(element.toUpperCase());
                }), menuItemId);
                wallpaperManager.setWallpaper(source);
            }
        });
    });
    return availableWallpaperSources;
};

const getAvailableViews = () => {
    const availableViews = [];
    viewManager.getAvailableViews().forEach(view => {
        const menuItemName = view.toUpperCase().substr(1);
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = getMenuItemLabelKey(menuItemName, "VIEW");
        availableViews.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: viewManager.getCurrentView() == view,
            type: "checkbox",
            click: () => {
                setActiveMenuItemOfList(viewManager.getAvailableViews().map((element) => {
                    return getMenuItemId(element.toUpperCase().substr(1));
                }), menuItemId);
                viewManager.showView(view);
            }
        });
    });
    return availableViews;
};

const getAvailableLanguages = () => {
    const availableLanguages = [];
    i18nManager.getAvailableLanguages().forEach(language => {
        const menuItemName = language.toUpperCase();
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = getMenuItemLabelKey(menuItemName, "LANGUAGE");
        availableLanguages.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: i18nManager.getCurrentLanguage() == language,
            type: "checkbox",
            click: () => {
                setActiveMenuItemOfList(i18nManager.getAvailableLanguages().map((element) => {
                    return getMenuItemId(element.toUpperCase());
                }), menuItemId);
                i18nManager.setLanguage(language);
            }
        });
    });
    return availableLanguages;
};

const refresh = () => {
    const translations = i18nManager.getTranslations([
        "DEBUG_LABEL", "QUIT_LABEL", "VIEW_LABEL",
        "LANGUAGE_LABEL", "PREFERENCES_LABEL", "LAUNCH_AT_STARTUP_LABEL",
        "WALLPAPER_LABEL", "APPLICATION_LABEL"]);
    const template = [
        {
            label: applicationManager.isMac() ? app.getName() : translations["APPLICATION_LABEL"],
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
                    label: translations["QUIT_LABEL"],
                    click: () => {
                        applicationManager.quit();
                    }
                }
            ]
        },
        {
            label: translations["VIEW_LABEL"],
            submenu: getAvailableViews()
        },
        {
            label: translations["WALLPAPER_LABEL"],
            submenu: getAvailableWallpaperSources()
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
                    submenu: getAvailableLanguages()
                }
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

const init = () => {
    wallpaperManager.onWallpaperChanged((source) => {
        setActiveMenuItemOfList(wallpaperManager.getAvailableWallpaperSources().map((element) => {
            return getMenuItemId(element.toUpperCase());
        }), getMenuItemId(source.toUpperCase()));
    });
    i18nManager.onLanguageChanged(() => {
        refresh();
    });
    refresh();
};

module.exports = {
    init: init
};