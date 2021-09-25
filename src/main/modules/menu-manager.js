const { Menu } = require("electron");

const applicationManager = require("./application-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const themeManager = require("./theme-manager");
const applicationUtils = require("./application-utils");

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

const getAvailableWallpaperSources = () => {
    const availableWallpaperSources = [];
    wallpaperManager.getAvailableSources().forEach(source => {
        const menuItemName = source.toUpperCase();
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = applicationUtils.getLabelKey(menuItemName, "WALLPAPER_SOURCE");
        availableWallpaperSources.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: wallpaperManager.getCurrentSource() == source,
            type: "checkbox",
            click: () => {
                wallpaperManager.setSource(source);
            }
        });
    });
    availableWallpaperSources.push({ type: "separator" });
    availableWallpaperSources.push({
        label: i18nManager.getTranslations(["MANAGE_LABEL"])["MANAGE_LABEL"],
        click: () => {
            viewManager.showView(viewManager.SOURCES_VIEW);
        }
    });
    return availableWallpaperSources;
};

const getAvailableViews = () => {
    const availableViews = [];
    viewManager.getAvailableViews().forEach(view => {
        const menuItemName = view.toUpperCase().substr(1);
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = applicationUtils.getLabelKey(menuItemName, "VIEW");
        availableViews.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: viewManager.getCurrentView() == view,
            type: "checkbox",
            click: () => {
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
        const menuItemLabelKey = applicationUtils.getLabelKey(menuItemName, "LANGUAGE");
        availableLanguages.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: i18nManager.getCurrentLanguage() == language,
            type: "checkbox",
            click: () => {
                i18nManager.setLanguage(language);
            }
        });
    });
    return availableLanguages;
};

const getAvailableThemes = () => {
    const availableThemes = [];
    themeManager.getAvailableThemes().forEach(theme => {
        const menuItemName = theme.toUpperCase();
        const menuItemId = getMenuItemId(menuItemName);
        const menuItemLabelKey = applicationUtils.getLabelKey(menuItemName, "THEME");
        availableThemes.push({
            id: menuItemId,
            label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
            checked: themeManager.getCurrentTheme() == theme,
            type: "checkbox",
            click: () => {
                themeManager.setTheme(theme);
            }
        });
    });
    return availableThemes;
};

const refresh = () => {
    try {
        const translations = i18nManager.getTranslations([
            "DEBUG_LABEL", "QUIT_LABEL", "VIEW_LABEL",
            "LANGUAGE_LABEL", "PREFERENCES_LABEL", "LAUNCH_AT_STARTUP_LABEL",
            "WALLPAPER_LABEL", "LAUNCH_LABEL", "LAUNCH_MINIMIZED_LABEL",
            "THEME_LABEL"]);
        const template = [
            {
                label: applicationManager.getProductName(),
                submenu: [
                    {
                        label: translations["DEBUG_LABEL"],
                        visible: applicationUtils.isDebug(),
                        click: () => {
                            applicationManager.openDevTools();
                        }
                    },
                    {
                        label: translations["QUIT_LABEL"],
                        click: () => {
                            applicationManager.quitApplication();
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
                        label: translations["LAUNCH_LABEL"],
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
                                id: "MENU_ITEM_LAUNCH_MINIMIZED_ID",
                                label: translations["LAUNCH_MINIMIZED_LABEL"],
                                checked: applicationManager.isLaunchedMinimized(),
                                type: "checkbox",
                                click: () => {
                                    changeMenuItemChecked("MENU_ITEM_LAUNCH_MINIMIZED_ID", applicationManager.toggleLaunchMinimized());
                                }
                            }
                        ]
                    },
                    {
                        label: translations["LANGUAGE_LABEL"],
                        submenu: getAvailableLanguages()
                    },
                    {
                        label: translations["THEME_LABEL"],
                        submenu: getAvailableThemes(),
                        visible: applicationUtils.isDebug()
                    }
                ]
            }
        ];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    } catch (err) {
        loggerManager.getLogger().error("MenuManager - Refresh : " + err);
    }
};

const init = () => {
    themeManager.onThemeChanged((message) => {
        setActiveMenuItemOfList(themeManager.getAvailableThemes().map((element) => {
            return getMenuItemId(element.toUpperCase());
        }), getMenuItemId(message.theme.toUpperCase()));
    });
    wallpaperManager.onWallpaperChanged((message) => {
        setActiveMenuItemOfList(wallpaperManager.getAvailableSources().map((element) => {
            return getMenuItemId(element.toUpperCase());
        }), getMenuItemId(message.source.toUpperCase()));
    });
    viewManager.onViewChanged((message) => {
        setActiveMenuItemOfList(viewManager.getAvailableViews().map((element) => {
            return getMenuItemId(element.toUpperCase().substr(1));
        }), getMenuItemId(message.view.toUpperCase().substr(1)));
    });
    i18nManager.onLanguageChanged((message) => {
        refresh();
    });
    refresh();
    loggerManager.getLogger().info("MenuManager - Init : OK");
};

module.exports = {
    init: init
};