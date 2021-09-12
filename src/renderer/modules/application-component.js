import rendererEventbus from "./renderer-eventbus.js";

export default {
    beforeMount() {
        rendererEventbus.onViewChanged(this.onViewChanged);
        rendererEventbus.onNewVersionAvailable(this.onNewVersionAvailable);
    },
    beforeUnmount() {
        rendererEventbus.onViewChanged(this.offViewChanged);
        rendererEventbus.onNewVersionAvailable(this.offNewVersionAvailable);
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
            const viewKey = view.toUpperCase().substr(1) + "_VIEW_LABEL";
            rendererEventbus.getTranslations([viewKey]).then((translations) => {
                document.title = translations[viewKey];
            });
        }
    }
};