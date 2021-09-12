import applicationUtils from "./application-utils.js";

export default () => {
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
                created() {
                    const that = this;
                    that.refreshSources();
                    window.eventbus.receive("languageChanged", () => {
                        that.refreshSources();
                    });
                    window.eventbus.receive("wallpaperChanged", () => {
                        that.refreshSources();
                    });
                },
                methods: {
                    setWallpaperSource: function (source) {
                        window.eventbus.send("showView", "/wallpaper");
                        window.eventbus.send("setWallpaperSource", source);
                    },
                    refreshTranslations: function () {
                        const that = this;
                        window.eventbus.invoke("getTranslations", ["SET_LABEL"]).then((translations) => {
                            that.translations = translations;
                        });
                    },
                    openExternal: function (url) {
                        window.eventbus.send("openExternal", url);
                    },
                    refreshSources: function () {
                        const that = this;
                        window.eventbus.invoke("getSourceDescriptions").then((sources) => {
                            that.sources = sources;
                            that.refreshTranslations();
                        });
                    }
                }
            });
        });
    });
};