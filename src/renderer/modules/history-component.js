import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default function () {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        items: [],
                        selectedItem: null,
                        translations: {}
                    }
                },
                beforeMount() {
                    rendererEventbus.onHistoryChanged(this.onHistoryChanged);
                    rendererEventbus.onLanguageChanged(this.onLanguageChanged);
                },
                created() {
                    this.refreshTranslations();
                    this.refreshItems();
                },
                beforeUnmount() {
                    rendererEventbus.offHistoryChanged(this.onHistoryChanged);
                    rendererEventbus.offLanguageChanged(this.onLanguageChanged);
                },
                methods: {
                    onHistoryChanged(lng) {
                        this.refreshItems();
                    },
                    onLanguageChanged(message) {
                        this.refreshTranslations();
                    },
                    refreshTranslations() {
                        rendererEventbus.getTranslations([
                            "SET_LABEL", "REMOVE_LABEL", "REMOVE_ALL_LABEL",
                            "CREATION_DATE_LABEL", "UPDATE_DATE_LABEL", "WALLPAPER_LABEL"
                        ]).then((translations) => {
                            this.translations = translations;
                        });
                    },
                    setUserWallpaper() {
                        const message = {
                            path: this.selectedItem.path
                        };
                        rendererEventbus.setUserWallpaper(message);
                        this.selectedItem = null;
                    },
                    setSelectemItem(item) {
                        this.selectedItem = this.selectedItem != item ? item : null;
                    },
                    removeItem() {
                        const message = {
                            id: this.selectedItem.id
                        };
                        rendererEventbus.removeHistoryItem(message);
                    },
                    removeAllItems() {
                        const message = {};
                        rendererEventbus.removeAllHistoryItems(message);
                    },
                    getTitle(item) {
                        let title = "";
                        title += this.translations["CREATION_DATE_LABEL"] + " : " + dayjs(item.created).format("DD/MM/YYYY HH:mm:ss");
                        title += "\n";
                        title += this.translations["UPDATE_DATE_LABEL"] + " : " + dayjs(item.updated).format("DD/MM/YYYY HH:mm:ss");
                        return title;
                    },
                    refreshItems() {
                        rendererEventbus.getHistoryItems().then((items) => {
                            this.items = items;
                            this.selectedItem = null;
                        });
                    }
                }
            });
        });
    });
};