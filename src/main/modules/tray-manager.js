const { Menu, app, Tray, nativeImage } = require("electron");
const path = require("path");

const applicationManager = require("./application-manager");
const i18nManager = require("./i18n-manager");

let tray = null;

const refresh = () => {
    if (tray == null) {
        const icon = nativeImage.createFromPath(path.join(__dirname, "..", "..", "resources", "images", "tray.png"))
        tray = new Tray(icon);
        tray.setToolTip(app.getName());
        if (applicationManager.isWindows()) {
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
                applicationManager.quit();
            }
        }
    ])
    tray.setContextMenu(contextMenu);
};

const init = () => {
    i18nManager.onLanguageChanged(() => {
        refresh();
    });
    refresh();
};

module.exports = {
    init: init
};