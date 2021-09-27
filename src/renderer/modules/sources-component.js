import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default function () {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        translations: {},
                        sources: []
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
                    onLanguageChanged(message) {
                        this.refreshTranslations();
                    },
                    onWallpaperChanged(message) {
                        this.refreshSources();
                    },
                    setWallpaperSource(source) {
                        const message = {
                            source: source
                        };
                        rendererEventbus.setWallpaperSource(message);
                    },
                    refreshTranslations() {
                        const translationKeys = [];
                        this.sources.forEach(source => {
                            translationKeys.push(source.labelKey);
                        });
                        translationKeys.push("SET_LABEL");
                        rendererEventbus.getTranslations(translationKeys).then((translations) => {
                            this.translations = translations;
                        });
                    },
                    openExternal(url) {
                        const message = {
                            url: url
                        };
                        rendererEventbus.openExternal(message);
                    },
                    refreshSources() {
                        rendererEventbus.getWallpaperAvailableSources().then((sources) => {
                            this.sources = sources;
                            this.refreshTranslations();
                        });
                    }
                }
            });
        });
    });
};