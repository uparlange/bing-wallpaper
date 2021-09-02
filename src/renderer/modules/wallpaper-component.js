import applicationUtils from "./application-utils.js";

export default () => {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        dropActive: false,
                        b64Wallpaper: null
                    }
                },
                created() {
                    const that = this;
                    // wallpaper data
                    window.api.invoke("getB64Wallpaper").then((b64Wallpaper) => {
                        that.b64Wallpaper = b64Wallpaper;
                    });
                    window.api.receive("b64Wallpaper", (b64Wallpaper) => {
                        that.b64Wallpaper = b64Wallpaper;
                    });
                },
                methods: {
                    onDragOver: function (event) {
                        event.preventDefault();
                    },
                    onDragEnter: function (event) {
                        this.dropActive = true;
                        event.preventDefault();
                    },
                    onDragLeave: function (event) {
                        this.dropActive = false;
                        event.preventDefault();
                    },
                    onDrop: function (event) {
                        this.dropActive = false;
                        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                            const path = event.dataTransfer.files[0].path;
                            window.api.send("setUserWallpaper", path);
                        }
                        event.preventDefault();
                    }
                }
            });
        });
    });
};