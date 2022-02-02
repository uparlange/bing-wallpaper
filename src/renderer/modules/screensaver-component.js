import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default function () {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        translations: {}
                    }
                },
                beforeMount() {
                    rendererEventbus.onLanguageChanged(this.onLanguageChanged);
                },
                created() {
                    this.refreshTranslations();
                },
                beforeUnmount() {
                    rendererEventbus.offLanguageChanged(this.onLanguageChanged);
                },
                methods: {
                    onLanguageChanged(message) {
                        this.refreshTranslations();
                    },
                    refreshTranslations() {
                        rendererEventbus.getTranslations([
                            "FLIQLO_DESCRIPTION_LABEL"
                        ]).then((translations) => {
                            this.translations = translations;
                        });
                    },
                    openExternal(url) {
                        const message = {
                            url: url
                        };
                        rendererEventbus.openExternal(message);
                    },
                }
            });
        });
    });
};