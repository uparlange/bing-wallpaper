export default {
    created() {
        const that = this;
        window.eventbus.receive("showView", (view) => {
            that.$router.push(view);
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