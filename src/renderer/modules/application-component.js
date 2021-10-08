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
        onDownloadProgress(message) {
            this.progress.value = message.progress;
        },
        onNewVersionAvailable(message) {
            rendererEventbus.getTranslations(["NEW_VERSION_AVAILABLE_LABEL", "DO_YOU_WANT_TO_INSTALL_LABEL"], { version: message.version }).then((translations) => {
                const confirmMessage = translations["NEW_VERSION_AVAILABLE_LABEL"] + ". " + translations["DO_YOU_WANT_TO_INSTALL_LABEL"];
                if (window.confirm(confirmMessage)) {
                    rendererEventbus.updateMyApplication(message);
                }
            });
        },
        onViewChanged(message) {
            this.$router.push(message.view);
            currentView = message;
            this.refreshDocumentTitle();
        },
        onLanguageChanged(message) {
            this.refreshDocumentTitle();
        },
        refreshDocumentTitle() {
            rendererEventbus.getTranslations([currentView.labelKey]).then((translations) => {
                document.title = translations[currentView.labelKey];
            });
        }
    }
};