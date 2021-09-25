import rendererEventbus from "./renderer-eventbus.js";

let currentView = null;

export default {
    data() {
        return {
            progress: {
                value: 0,
                options: {
                    color: "#FFEA82"
                }
            }
        }
    },
    beforeMount() {
        rendererEventbus.onViewChanged(this.onViewChanged);
        rendererEventbus.onNewVersionAvailable(this.onNewVersionAvailable);
        rendererEventbus.onLanguageChanged(this.onLanguageChanged);
        rendererEventbus.onDownloadProgress(this.onDownloadProgress);
    },
    beforeUnmount() {
        rendererEventbus.offViewChanged(this.onViewChanged);
        rendererEventbus.offNewVersionAvailable(this.onNewVersionAvailable);
        rendererEventbus.offLanguageChanged(this.onLanguageChanged);
        rendererEventbus.offDownloadProgress(this.onDownloadProgress);
    },
    methods: {
        onDownloadProgress: function (message) {
            this.progress.value = message.progress == 1 ? 0 : message.progress;
        },
        onNewVersionAvailable: function (message) {
            rendererEventbus.getTranslations(["NEW_VERSION_AVAILABLE_LABEL"], { version: message.version }).then((translations) => {
                if (window.confirm(translations["NEW_VERSION_AVAILABLE_LABEL"])) {
                    const message = {
                        version: message.version
                    };
                    rendererEventbus.updateMyApplication(message);
                }
            });
        },
        onViewChanged: function (message) {
            this.$router.push(message.view);
            currentView = message.view;
            this.refreshDocumentTitle();
        },
        onLanguageChanged: function (message) {
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