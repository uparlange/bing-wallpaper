import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default () => {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        translations: {},
                        sourceDescriptions: []
                    }
                },
                beforeMount() {
                    rendererEventbus.onLanguageChanged(this.onLanguageChanged);
                    rendererEventbus.onWallpaperChanged(this.onWallpaperChanged);
                },
                created() {
                    this.refreshSources();
                },
                beforeUnmount() {
                    rendererEventbus.offLanguageChanged(this.onLanguageChanged);
                    rendererEventbus.offWallpaperChanged(this.onWallpaperChanged);
                },
                methods: {
                    onLanguageChanged: function (message) {
                        this.refreshTranslations();
                    },
                    onWallpaperChanged: function (message) {
                        this.refreshSources();
                    },
                    setWallpaperSource: function (source) {
                        const message = {
                            source: source
                        };
                        rendererEventbus.setWallpaperSource(message);
                    },
                    refreshTranslations: function () {
                        const translationKeys = [];
                        this.sourceDescriptions.forEach(sourceDescription => {
                            translationKeys.push(sourceDescription.key);
                        });
                        translationKeys.push("SET_LABEL");
                        rendererEventbus.getTranslations(translationKeys).then((translations) => {
                            this.translations = translations;
                        });
                    },
                    openExternal: function (url) {
                        const message = {
                            url: url
                        };
                        rendererEventbus.openExternal(message);
                    },
                    refreshSources: function () {
                        rendererEventbus.getSourceDescriptions().then((sourceDescriptions) => {
                            this.sourceDescriptions = sourceDescriptions;
                            this.refreshTranslations();
                        });
                    }
                }
            });
        });
    });
};