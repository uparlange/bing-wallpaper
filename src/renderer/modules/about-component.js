import applicationUtils from "./application-utils.js";

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
                created() {
                    const that = this;
                    // translations
                    that.refreshTranslations();
                    window.eventbus.receive("languageChanged", () => {
                        that.refreshTranslations();
                    });
                    // version infos
                    window.eventbus.invoke("getVersions").then((versions) => {
                        that.versions = versions;
                    });
                },
                methods: {
                    refreshTranslations: function () {
                        const that = this;
                        window.eventbus.invoke("getTranslations", ["AUTHOR_LABEL", "BASED_ON_LABEL"]).then((translations) => {
                            that.translations = translations;
                        });
                    },
                    openExternal: function (url) {
                        window.eventbus.send("openExternal", url);
                    }
                }
            });
        });
    });
};