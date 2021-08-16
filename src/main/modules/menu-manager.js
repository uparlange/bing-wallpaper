const { app, Menu, BrowserWindow } = require("electron");

const applicationUtils = require("./application-utils");
const wallpaperManager = require("./wallpaper-manager");
const eventbusManager = require("./eventbus-manager");
const i18nManager = require("./i18n-manager");

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
                        app.quit();
                    }
                }
            ]
        },
        {
            label: i18nManager.getTranslation("VIEW_LABEL"),
            submenu: [
                {
                    label: i18nManager.getTranslation("WALLPAPER_LABEL"),
                    click: () => {
                        eventbusManager.sendRendererMessage("showView", "/wallpaper");
                    }
                }, {
                    label: i18nManager.getTranslation("ABOUT_LABEL"),
                    click: () => {
                        eventbusManager.sendRendererMessage("showView", "/about");
                    }
                }
            ]
        },
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
        resolve();
    });
};

module.exports = {
    init: init
};