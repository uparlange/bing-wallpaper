export default {
    loadTemplate(componentUrl) {
        return new Promise((resolve, reject) => {
            const componentName = new URL(componentUrl).pathname.split("/").pop();
            const viewName = componentName.split("-")[0];
            const viewUrl = "views/" + viewName + "-view.html";
            fetch(viewUrl).then((res) => {
                resolve(res.text());
            });
        });
    }
};