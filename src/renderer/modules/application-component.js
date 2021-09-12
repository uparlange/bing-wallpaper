import rendererEventbus from "./renderer-eventbus.js";

let currentView = null;

export default {
    beforeMount() {
        rendererEventbus.onViewChanged(this.onViewChanged);
        rendererEventbus.onNewVersionAvailable(this.onNewVersionAvailable);
        rendererEventbus.onLanguageChanged(this.onLanguageChanged);
    },
    beforeUnmount() {
        rendererEventbus.offViewChanged(this.onViewChanged);
        rendererEventbus.offNewVersionAvailable(this.onNewVersionAvailable);
        rendererEventbus.offLanguageChanged(this.onLanguageChanged);
    },
    methods: {
        onNewVersionAvailable: function (version) {
            rendererEventbus.getTranslations(["NEW_VERSION_AVAILABLE_LABEL"], { version: version }).then((translations) => {
                if (window.confirm(translations["NEW_VERSION_AVAILABLE_LABEL"])) {
                    rendererEventbus.sendMainMessage("updateMyApplication", version);
                }
            });
        },
        onViewChanged: function (view) {
            this.$router.push(view);
            currentView = view;
            this.refreshDocumentTitle();
        },
        onLanguageChanged: function (lng) {
            this.refreshDocumentTitle();
        },
        refreshDocumentTitle: function () {
            const viewKey = currentView.toUpperCase().substr(1) + "_VIEW_LABEL";
            rendererEventbus.getTranslations([viewKey]).then((translations) => {
                document.title = translations[viewKey];
            });
        }
    }
};