import { createApp } from "./node_modules/vue/dist/vue.esm-browser.prod.js";

const WALLPAPER_VIEW = "wallpaper";
const ABOUT_VIEW = "about";

const app = createApp({
    data() {
        return {
            b64Wallpaper: null,
            dropActive: false,
            versions: {},
            currentView: WALLPAPER_VIEW
        }
    },
    watch: {
        b64Wallpaper: function (val) {
            this.currentView = WALLPAPER_VIEW;
        },
    },
    created() {
        this.initEvents();
        this.initDragDrop();
    },
    methods: {
        initDragDrop: function () {
            const that = this;
            window.ondragover = (event) => {
                event.preventDefault();
            };
            window.ondragenter = (event) => {
                that.dropActive = true;``
                event.preventDefault();
            };
            window.ondragleave = (event) => {
                that.dropActive = false;
                event.preventDefault();
            };
            window.ondrop = (event) => {
                that.dropActive = false;
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const path = event.dataTransfer.files[0].path;
                    that.sendMainMessage("setUserWallpaper", { path: path });
                }
                event.preventDefault();
            }
        },
        initEvents: function () {
            const that = this;
            window.api.receive("fromMain", (event) => {
                switch (event.name) {
                    case "updateData": that[event.message.key] = event.message.value; break;
                    case "showView": that.currentView = event.message.view; break;
                }
            });
        },
        openExternal: function (url) {
            this.sendMainMessage("openExternal", { url: url });
        },
        sendMainMessage: function (name, message) {
            window.api.send("toMain", {
                name: name,
                message: message
            });
        }
    }
}).mount("#app");