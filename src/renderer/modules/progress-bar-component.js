let progressBar = null;

export default {
    template: '<div class="progress-bar" ref="container"></div>',
    props: ["type", "value", "options"],
    watch: {
        type(newValue, oldValue) {
            if (newValue != oldValue) {
                this.render();
            }
        },
        value(newValue, oldValue) {
            this.setvalue(newValue);
        },
        options(newValue, oldValue) {
            if (newValue != oldValue) {
                this.render();
            }
        }
    },
    mounted() {
        this.render();
    },
    methods: {
        setvalue(value) {
            if (progressBar != null) {
                progressBar.set(value);
            }
        },
        render() {
            if (progressBar != null) {
                progressBar.destroy();
                progressBar = null;
            }
            let clazz = null;
            if (this.type && this.options) {
                switch (this.type) {
                    case "line": clazz = ProgressBar.Line; break;
                    case "circle": clazz = ProgressBar.Circle; break;
                    case "semicircle": clazz = ProgressBar.SemiCircle; break;
                }
            }
            progressBar = new clazz(this.$refs.container, this.options);
            this.setvalue(this.value);
        }
    }
};