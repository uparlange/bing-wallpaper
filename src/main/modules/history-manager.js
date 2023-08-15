import { app } from "electron";
import md5File from "md5-file";
import fs from "fs";
import path from "path";

import loggerManager from "./logger-manager";
import storageManager from "./storage-manager";
import eventbusManager from "./eventbus-manager";

let items = [];

function init() {
    items = storageManager.getData("history", []).value;
    loggerManager.getLogger().info("HistoryManager - Init : OK");
};

function completeAddItem(historyItem) {
    historyItem.updated = new Date();
    items.unshift(historyItem);
    eventbusManager.sendRendererMessage("historyChanged");
};

function addItem(item) {
    md5File(item.path).then((hash) => {
        const historyItemIndex = items.findIndex(element => element.id == hash);
        if (historyItemIndex != -1) {
            item = items.splice(historyItemIndex, 1)[0];
            completeAddItem(item);
        } else {
            const historyItem = {
                id: hash,
                created: new Date(),
                source: item.source,
                path: path.join(app.getPath("userData"), "historyWallpaper" + hash + ".jpg")
            };
            fs.copyFile(item.path, historyItem.path, (err) => {
                if (err) {
                    loggerManager.getLogger().error("HistoryManager - Copy file '" + item.path + "' to '" + historyItem.path + "', '" + err + "'");
                } else {
                    completeAddItem(historyItem);
                }
            });
        }
    });
};

function getItems() {
    return items;
};

function removeItemByIndex(index) {
    const historyItem = items.splice(index, 1)[0];
    try {
        fs.unlinkSync(historyItem.path);
    } catch (err) {
        loggerManager.getLogger().error("HistoryManager - removeFileItem '" + historyItem.path + "', '" + err + "'");
    }
};

function removeItemById(itemId) {
    const historyItemIndex = items.findIndex(element => element.id == itemId);
    if (historyItemIndex != -1) {
        removeItemByIndex(historyItemIndex);
        eventbusManager.sendRendererMessage("historyChanged");
    }
};

function removeAllItems() {
    while (items.length > 0) {
        removeItemByIndex(0);
    }
    eventbusManager.sendRendererMessage("historyChanged");
};

export default {
    init: init,
    addItem: addItem,
    removeItemById: removeItemById,
    removeAllItems: removeAllItems,
    getItems: getItems
};