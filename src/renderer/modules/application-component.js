export default {
    created() {
        const that = this;
        window.api.receive("showView", (view) => {
            that.$router.push(view);
        });
    }
};