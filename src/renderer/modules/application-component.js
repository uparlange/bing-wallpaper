export default {
    created() {
        const that = this;
        window.eventbus.receive("showView", (view) => {
            that.$router.push(view);
        });
    }
};