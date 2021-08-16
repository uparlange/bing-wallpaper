export default {
    data() {
        return {
            dropActive: false
        }
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
                that.dropActive = true; ``
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
                    window.api.send("toMain", {
                        name: "setUserWallpaper",
                        message: { path: path }
                    });
                }
                event.preventDefault();
            }
        },
        initEvents: function () {
            const that = this;
            window.api.receive("showView", (view) => {
                that.$router.push(view);
            });
        }
    }
};