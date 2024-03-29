import { app } from "electron";
import fs from "fs";
import path from "path";

import loggerManager from "./logger-manager";

const STORAGE_PATH = path.join(app.getPath("userData"), "storage.json");
const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
const reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

let model = {};

function getData(key, defaultValue) {
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

function setData(key, value) {
    const data = getData(key);
    if (value != data.value) {
        loggerManager.getLogger().info("StorageManager - Set/Update data '" + key + "' with value '" + value + "'");
        data.value = value;
    }
    data.date = new Date();
    save();
};

function save() {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(model));
    loggerManager.getLogger().info("StorageManager - Save storage to '" + STORAGE_PATH + "'");
};

function dateParser(key, value) {
    if (typeof value === 'string') {
        var a = reISO.exec(value);
        if (a)
            return new Date(value);
        a = reMsAjax.exec(value);
        if (a) {
            var b = a[1].split(/[-+,.]/);
            return new Date(b[0] ? +b[0] : 0 - +b[1]);
        }
    }
    return value;
};

function init() {
    return new Promise((resolve, reject) => {
        fs.readFile(STORAGE_PATH, "utf8", (err, data) => {
            if (err) {
                loggerManager.getLogger().error("StorageManager - Init : " + err);
            } else {
                model = Object.assign(model, JSON.parse(data, dateParser));
                loggerManager.getLogger().info("StorageManager - Init : OK");
            }
            resolve();
        });
    });
};

export default {
    init: init,
    setData: setData,
    getData: getData,
    save: save
};