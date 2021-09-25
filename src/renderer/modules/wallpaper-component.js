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
                        wallpaperPath: null,
                        wallpaperVisible: false
                    }
                },
                watch: {
                    wallpaperPath(newValue, oldValue) {
                        this.wallpaperVisible = newValue != null;
                    }
                },
                beforeMount() {
                    rendererEventbus.onWallpaperChanged(this.onWallpaperChanged);
                },
                created() {
                    this.refreshWallpaper();
                },
                beforeUnmount() {
                    rendererEventbus.offWallpaperChanged(this.onWallpaperChanged);
                },
                methods: {
                    onWallpaperChanged: function (message) {
                        this.refreshWallpaper();
                    },
                    refreshWallpaper: function () {
                        rendererEventbus.getCurrentWallpaperPath().then((path) => {
                            this.wallpaperPath = path + "?version=" + new Date().getTime();
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
                            const message = {
                                path: path
                            };
                            rendererEventbus.setUserWallpaper(message);
                        }
                        event.preventDefault();
                    }
                }
            });
        });
    });
};