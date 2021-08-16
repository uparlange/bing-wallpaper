const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const loggerManager = require("./logger-manager");

const STORAGE_PATH = path.join(app.getPath("userData"), "storage.json");

let model = {
    language: null,
    view: null,
    bingWallpaperUrl: null
};

const getData = (key, defaultValue) => {
    let data = model[key];
    if (data == null) {
        data = {
            value: defaultValue != null ? defaultValue : null,
            date: new Date()
        };
        model[key] = data;
    }
    return data;
};

const setData = (key, value) => {
    const data = getData(key);
    data.value = value;
};

const save = () => {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(model));
};

const init = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(STORAGE_PATH, "utf8", (err, data) => {
            if (err) {
                loggerManager.getLogger().error("StorageManager - Init : " + err);
            } else {
                model = Object.assign(model, JSON.parse(data));
            }
            resolve();
        });
    });
};

module.exports = {
    init: init,
    setData: setData,
    getData: getData,
    save: save
};