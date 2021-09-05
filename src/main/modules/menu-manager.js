const { Menu, BrowserWindow, app, Tray, nativeImage } = require("electron");
const path = require("path");

const applicationManager = require("./application-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const viewManager = require("./view-manager");

let tray = null;

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

const refreshMenu = () => {
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

const refreshTray = () => {
    if (tray == null) {
        const icon = nativeImage.createFromPath(path.join(__dirname, "..", "..", "resources", "images", "tray.png"))
        tray = new Tray(icon);
        tray.setToolTip(app.getName());
        tray.on("click", () => {
            applicationManager.createWindow();
        });
    }
    const translations = i18nManager.getTranslations(["DISPLAY_LABEL", "QUIT_LABEL"]);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: translations["DISPLAY_LABEL"],
            click: () => {
                applicationManager.createWindow();
            }
        },
        {
            type: "separator"
        },
        {
            label: translations["QUIT_LABEL"],
            click: () => {
                applicationManager.quit();
            }
        }
    ])
    tray.setContextMenu(contextMenu);
};

const refresh = () => {
    refreshMenu();
    refreshTray();
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