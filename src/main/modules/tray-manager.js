import { Menu, app, Tray, nativeImage } from "electron";
import path from "path";

import applicationManager from "./application-manager";
import i18nManager from "./i18n-manager";
import loggerManager from "./logger-manager";
import applicationUtils from "./application-utils";

let tray = null;

function refresh() {
    try {
        if (tray == null) {
            const icon = nativeImage.createFromPath(path.join(__dirname, "resources", "images", "tray.png"))
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

function init() {
    i18nManager.onLanguageChanged((message) => {
        refresh();
    });
    refresh();
    loggerManager.getLogger().info("TrayManager - Init : OK");
};

export default {
    init: init
};