import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default () => {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        versions: {},
                        translations: {}
                    }
                },
                beforeMount() {
                    rendererEventbus.onLanguageChanged(this.refreshTranslations);
                },
                created() {
                    this.refreshTranslations();
                    rendererEventbus.getVersions().then((versions) => {
                        this.versions = versions;
                    });
                },
                beforeUnmount() {
                    rendererEventbus.offLanguageChanged(this.refreshTranslations);
                },
                methods: {
                    refreshTranslations: function () {
                        rendererEventbus.getTranslations(["AUTHOR_LABEL", "BASED_ON_LABEL", "APPLICATION_LABEL"]).then((translations) => {
                            this.translations = translations;
                        });
                    },
                    openExternal: function (url) {
                        rendererEventbus.sendMainMessage("openExternal", url);
                    }
                }
            });
        });
    });
};