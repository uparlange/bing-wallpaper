import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

const EMPTY_IMG_SRC = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function () {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                data() {
                    return {
                        dropActive: false,
                        wallpaperSrc: EMPTY_IMG_SRC,
                        iconSrc: EMPTY_IMG_SRC,
                        homeUrl: null
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
                    openHomeUrl() {
                        if (this.homeUrl) {
                            const message = {
                                url: this.homeUrl
                            };
                            rendererEventbus.openExternal(message);
                        }
                    },
                    onWallpaperChanged(message) {
                        this.refreshWallpaper();
                    },
                    refreshWallpaper() {
                        rendererEventbus.getCurrentWallpaperSource().then((source) => {
                            let wallpaperSrc = EMPTY_IMG_SRC;
                            let iconSrc = EMPTY_IMG_SRC;
                            if (source.path) {
                                wallpaperSrc = source.path + "?version=" + new Date().getTime();
                            }
                            if (source.iconFileName) {
                                iconSrc = "./../resources/images/" + source.iconFileName + "?version=" + new Date().getTime();
                            }
                            this.wallpaperSrc = wallpaperSrc;
                            this.iconSrc = iconSrc;
                            this.homeUrl = source.homeUrl;
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