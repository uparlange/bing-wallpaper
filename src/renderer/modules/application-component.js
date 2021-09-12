export default {
    created() {
        const that = this;
        window.eventbus.receive("viewChanged", (view) => {
            that.$router.push(view);
            const viewKey = view.toUpperCase().substr(1) + "_VIEW_LABEL";
            window.eventbus.invoke("getTranslations", [viewKey]).then((translations) => {
                document.title = translations[viewKey];
            });
        });
        window.eventbus.receive("newVersionAvailable", (version) => {
            window.eventbus.invoke("getTranslations", ["NEW_VERSION_AVAILABLE_LABEL"], { version: version }).then((translations) => {
                if (window.confirm(translations["NEW_VERSION_AVAILABLE_LABEL"])) {
                    window.eventbus.send("updateMyApplication", version);
                }
            });
        });
    }
};