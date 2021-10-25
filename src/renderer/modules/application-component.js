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
        rendererEventbus.onLanguageChanged(this.onLanguageChanged);
        rendererEventbus.onDownloadProgress(this.onDownloadProgress);
    },
    beforeUnmount() {
        rendererEventbus.offViewChanged(this.onViewChanged);
        rendererEventbus.offLanguageChanged(this.onLanguageChanged);
        rendererEventbus.offDownloadProgress(this.onDownloadProgress);
    },
    methods: {
        onDownloadProgress(message) {
            this.progress.value = message.progress;
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