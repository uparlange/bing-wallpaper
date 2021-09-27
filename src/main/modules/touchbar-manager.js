const { TouchBar } = require("electron")
const { TouchBarButton } = TouchBar

const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const i18nManager = require("./i18n-manager");
const applicationUtils = require("./application-utils");

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

module.exports = {
    init: init,
    getTouchbar: getTouchbar
};