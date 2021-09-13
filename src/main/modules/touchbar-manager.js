const { TouchBar } = require("electron")
const { TouchBarButton } = TouchBar

const viewManager = require("./view-manager");
const loggerManager = require("./logger-manager");
const i18nManager = require("./i18n-manager");

let touchBar = null;

const getMenuItemLabelKey = (name, type) => {
    return name + "_" + type + "_LABEL";
};

const getTouchbar = (forceRefresh) => {
    if (forceRefresh) {
        touchBar = null;
    }
    if (touchBar == null) {
        const items = [];
        viewManager.getAvailableViews().forEach(view => {
            const menuItemName = view.toUpperCase().substr(1);
            const menuItemLabelKey = getMenuItemLabelKey(menuItemName, "VIEW");
            items.push(new TouchBarButton({
                label: i18nManager.getTranslations([menuItemLabelKey])[menuItemLabelKey],
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