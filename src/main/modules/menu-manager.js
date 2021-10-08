const { Menu } = require("electron");

const applicationManager = require("./application-manager");
const wallpaperManager = require("./wallpaper-manager");
const i18nManager = require("./i18n-manager");
const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const themeManager = require("./theme-manager");
const applicationUtils = require("./application-utils");

function changeMenuItemChecked(menuItemId, checked) {
    Menu.getApplicationMenu().getMenuItemById(menuItemId).checked = checked;
};

function setActiveMenuItemOfList(menuItemIds, activeMenuItemId) {
    menuItemIds.forEach((menuItemId) => {
        changeMenuItemChecked(menuItemId, menuItemId == activeMenuItemId);
    });
};

function getAvailableWallpaperSources() {
    const availableWallpaperSources = [];
    wallpaperManager.getAvailableSources().forEach(element => {
        availableWallpaperSources.push({
            id: element.source,
            label: i18nManager.getTranslations([element.labelKey])[element.labelKey],
            checked: element.current,
            type: "checkbox",
            click: () => {
                wallpaperManager.setSource(element.source);
            }
        });
        if (element.separatorAfter) {
            availableWallpaperSources.push({
                type: "separator"
            });
        }
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

function getAvailableViews() {
    const availableViews = [];
    viewManager.getAvailableViews().forEach(element => {
        availableViews.push({
            id: element.view,
            label: i18nManager.getTranslations([element.labelKey])[element.labelKey],
            checked: element.current,
            type: "checkbox",
            click: () => {
                viewManager.showView(element.view);
            }
        });
        if (element.separatorAfter) {
            availableViews.push({
                type: "separator"
            });
        }
    });
    return availableViews;
};

function getAvailableLanguages() {
    const availableLanguages = [];
    i18nManager.getAvailableLanguages().forEach(element => {
        availableLanguages.push({
            id: element.lng,
            label: i18nManager.getTranslations([element.labelKey])[element.labelKey],
            checked: element.current,
            type: "checkbox",
            click: () => {
                i18nManager.setLanguage(element.lng);
            }
        });
    });
    return availableLanguages;
};

function getAvailableThemes() {
    const availableThemes = [];
    themeManager.getAvailableThemes().forEach(element => {
        availableThemes.push({
            id: element.theme,
            label: i18nManager.getTranslations([element.labelKey])[element.labelKey],
            checked: element.current,
            type: "checkbox",
            click: () => {
                themeManager.setTheme(element.theme);
            }
        });
    });
    return availableThemes;
};

function getMainMenu() {
    const mainMenu = [];
    if (applicationUtils.isDebug()) {
        mainMenu.push({
            label: i18nManager.getTranslations(["DEBUG_LABEL"])["DEBUG_LABEL"],
            visible: applicationUtils.isDebug(),
            click: () => {
                viewManager.showView(viewManager.DEBUG_VIEW);
            }
        });
        mainMenu.push({
            type: "separator"
        });
    }
    mainMenu.push({
        label: i18nManager.getTranslations(["QUIT_LABEL"])["QUIT_LABEL"],
        click: () => {
            applicationManager.quitApplication();
        }
    });
    return mainMenu;
}

function refresh() {
    try {
        const translations = i18nManager.getTranslations([
            "VIEW_LABEL", "LANGUAGE_LABEL", "PREFERENCES_LABEL", "LAUNCH_AT_STARTUP_LABEL",
            "WALLPAPER_LABEL", "LAUNCH_LABEL", "LAUNCH_MINIMIZED_LABEL", "THEME_LABEL"]);
        const template = [
            {
                label: applicationManager.getProductName(),
                submenu: getMainMenu()
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
                        submenu: getAvailableThemes()
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

function init() {
    themeManager.onThemeChanged((message) => {
        setActiveMenuItemOfList(themeManager.getAvailableThemes().map((element) => {
            return element.theme;
        }), message.theme);
    });
    wallpaperManager.onWallpaperChanged((message) => {
        setActiveMenuItemOfList(wallpaperManager.getAvailableSources().map((element) => {
            return element.source;
        }), message.source);
    });
    viewManager.onViewChanged((message) => {
        setActiveMenuItemOfList(viewManager.getAvailableViews().map((element) => {
            return element.view;
        }), message.view);
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