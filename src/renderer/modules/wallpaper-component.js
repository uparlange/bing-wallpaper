import applicationUtils from "./application-utils.js";

export default () => {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate("views/wallpaper-view.html").then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        b64Wallpaper: null
                    }
                },
                created() {
                    const that = this;
                    window.api.invoke("getB64Wallpaper").then((b64Wallpaper) => {
                        that.b64Wallpaper = b64Wallpaper;
                    });
                    window.api.receive("b64Wallpaper", (b64Wallpaper) => {
                        that.b64Wallpaper = b64Wallpaper;
                    });
                }
            });
        });
    });
};