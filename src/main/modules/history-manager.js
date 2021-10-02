const { app } = require("electron");
const md5File = require("md5-file");
const fs = require("fs");
const path = require("path");

const loggerManager = require("./logger-manager");
const storageManager = require("./storage-manager");
const eventbusManager = require("./eventbus-manager");

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
        const historyItem = {
            id: hash,
            source: item.source,
            path: path.join(app.getPath("userData"), "historyWallpaper" + hash + ".jpg")
        };
        const historyItemIndex = items.findIndex(element => element.id == historyItem.id);
        if (historyItemIndex != -1) {
            item = items.splice(historyItemIndex, 1)[0];
            completeAddItem(historyItem);
        } else {
            historyItem.created = new Date();
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

module.exports = {
    init: init,
    addItem: addItem,
    removeItemById: removeItemById,
    removeAllItems: removeAllItems,
    getItems: getItems
};