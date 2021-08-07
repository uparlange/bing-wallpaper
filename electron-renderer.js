import { createApp } from "./node_modules/vue/dist/vue.esm-browser.prod.js";

const app = createApp({
    data() {
        return {
            b64Wallpaper: null,
            dropActive: false,
            versions: {}
        }
    },
    created() {
        this.initEventBus();
    },
    methods: {
        initEventBus: function () {
            const that = this;
            window.api.receive("fromMain", (event) => {
                if (event.name == "dataChanged") {
                    that[event.message.key] = event.message.value;
                }
            });
        },
        dragEnter: function (event) {
            event.preventDefault();
            if (event.target.className.includes("dropzone")) {
                this.dropActive = true;
            }
        },
        dragLeave: function (event) {
            event.preventDefault();
            this.dropActive = false;
        },
        dragDrop: function (event) {
            event.preventDefault();
            this.dropActive = false;
            if (event.target.className.includes("dropzone")) {
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const path = event.dataTransfer.files[0].path;
                    this.sendMainMessage("setUserWallpaper", { path: path });
                }
            }
        },
        sendMainMessage: function (name, message) {
            window.api.send("toMain", {
                name: name,
                message: message
            });
        }
    }
}).mount("#app");