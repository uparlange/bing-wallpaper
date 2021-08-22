export default {
    loadTemplate: (url) => {
        return new Promise((resolve, reject) => {
            fetch(url).then((res) => {
                resolve(res.text());
            });
        });
    }
};