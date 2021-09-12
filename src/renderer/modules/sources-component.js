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
                    onLanguageChanged: function (lng) {
                        this.refreshTranslations();
                    },
                    onWallpaperChanged: function (source) {
                        this.refreshSources();
                    },
                    setWallpaperSource: function (source) {
                        rendererEventbus.sendMainMessage("showView", "/wallpaper");
                        rendererEventbus.sendMainMessage("setWallpaperSource", source);
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
                        rendererEventbus.sendMainMessage("openExternal", url);
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