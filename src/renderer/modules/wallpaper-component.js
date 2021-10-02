import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default function () {
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
                    onWallpaperChanged(message) {
                        this.refreshWallpaper();
                    },
                    refreshWallpaper() {
                        this.wallpaperVisible = false;
                        rendererEventbus.getCurrentWallpaperPath().then((path) => {
                            this.wallpaperPath = path + "?version=" + new Date().getTime();
                            this.wallpaperVisible = true;
                        });
                    },
                    onDragOver(event) {
                        event.preventDefault();
                    },
                    onDragEnter(event) {
                        this.dropActive = true;
                        event.preventDefault();
                    },
                    onDragLeave(event) {
                        this.dropActive = false;
                        event.preventDefault();
                    },
                    onDrop(event) {
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