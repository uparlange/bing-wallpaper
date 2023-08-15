import { TouchBar } from "electron";
const { TouchBarButton } = TouchBar;

import viewManager from "./view-manager";
import loggerManager from "./logger-manager";
import i18nManager from "./i18n-manager";

let touchBar = null;

function getTouchbar(forceRefresh) {
    if (forceRefresh) {
        touchBar = null;
    }
    if (touchBar == null) {
        const items = [];
        viewManager.getAvailableViews().forEach(element => {
            items.push(new TouchBarButton({
                label: i18nManager.getTranslations([element.labelKey])[element.labelKey],
                backgroundColor: element.current ? "#FFFFFF" : "#333",
                color: element.current ? "#333" : "#FFFFFF",
                click: () => {
                    viewManager.showView(element.view);
                }
            }));
        });
        touchBar = new TouchBar({ items: items });
    }
    return touchBar;
};

function init() {
    loggerManager.getLogger().info("TouchbarManager - Init : OK");
};

export default {
    init: init,
    getTouchbar: getTouchbar
};