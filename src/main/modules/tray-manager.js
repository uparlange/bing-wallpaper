const { Menu, app, Tray, nativeImage } = require("electron");
const path = require("path");

const applicationManager = require("./application-manager");
const i18nManager = require("./i18n-manager");
const loggerManager = require("./logger-manager");
const applicationUtils = require("./application-utils");

let tray = null;

const refresh = () => {
    try {
        if (tray == null) {
            const icon = nativeImage.createFromPath(path.join(__dirname, "..", "..", "resources", "images", "tray.png"))
            tray = new Tray(icon);
            tray.setToolTip(applicationManager.getProductName());
            if (applicationUtils.isWindows()) {
                tray.on("click", () => {
                    applicationManager.createWindow();
                });
            }
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
                    applicationManager.quitApplication();
                }
            }
        ])
        tray.setContextMenu(contextMenu);
    } catch (err) {
        loggerManager.getLogger().error("TrayManager - Refresh : " + err);
    }
};

const init = () => {
    i18nManager.onLanguageChanged(() => {
        refresh();
    });
    refresh();
    loggerManager.getLogger().info("TrayManager - Init : OK");
};

module.exports = {
    init: init
};