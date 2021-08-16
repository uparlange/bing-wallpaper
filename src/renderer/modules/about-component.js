import applicationUtils from "./application-utils.js";

export default () => {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate("views/about-view.html").then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        versions: {}
                    }
                },
                created() {
                    const that = this;
                    window.api.invoke("getVersions").then((versions) => {
                        that.versions = versions;
                    });
                },
                methods: {
                    openExternal: function (url) {
                        window.api.send("toMain", {
                            name: "openExternal",
                            message: { url: url }
                        });
                    }
                }
            });
        });
    });
};