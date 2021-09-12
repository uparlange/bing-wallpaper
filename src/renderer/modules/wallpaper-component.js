import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

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
                beforeMount() {
                    rendererEventbus.onB64WallpaperChanged(this.refresh64Wallpaper);
                },
                created() {
                    this.refresh64Wallpaper();
                },
                beforeUnmount() {
                    rendererEventbus.offB64WallpaperChanged(this.refresh64Wallpaper);
                },
                methods: {
                    refresh64Wallpaper: function () {
                        rendererEventbus.getB64Wallpaper().then((b64Wallpaper) => {
                            this.b64Wallpaper = b64Wallpaper;
                        });
                    },
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
                            rendererEventbus.sendMainMessage("setUserWallpaper", path);
                        }
                        event.preventDefault();
                    }
                }
            });
        });
    });
};