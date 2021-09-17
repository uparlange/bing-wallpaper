const { TouchBar } = require("electron")
const { TouchBarButton } = TouchBar

const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const i18nManager = require("./i18n-manager");
const applicationUtils = require("./application-utils");

let touchBar = null;

const getTouchbar = (forceRefresh) => {
    if (forceRefresh) {
        touchBar = null;
    }
    if (touchBar == null) {
        const items = [];
        viewManager.getAvailableViews().forEach(view => {
            const menuItemName = view.toUpperCase().substr(1);
            const menuItemLabelKey = applicationUtils.getLabelKey(menuItemName, "VIEW");
            items.push(new TouchBarButton({
                label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
                backgroundColor: viewManager.getCurrentView() == view ? "#FFFFFF" : "#333",
                color: viewManager.getCurrentView() == view ? "#333" : "#FFFFFF",
                click: () => {
                    viewManager.showView(view);
                }
            }));
        });
        touchBar = new TouchBar({ items: items });
    }
    return touchBar;
};

const init = () => {
    loggerManager.getLogger().info("TouchbarManager - Init : OK");
};

module.exports = {
    init: init,
    getTouchbar: getTouchbar
};