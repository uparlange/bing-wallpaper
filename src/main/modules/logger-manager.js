const { app } = require("electron");
const log4js = require("log4js");
const path = require("path");

const APPLICATION_LOG_PATH = path.join(app.getPath("userData"), "application.log");

let logger = null;

function getLogger() {
    if (logger == null) {
        log4js.configure({
            appenders: {
                console: { type: "console" },
                file: { type: "dateFile", daysToKeep: 1, filename: APPLICATION_LOG_PATH }
            },
            categories: {
                default: { appenders: ["file", "console"], level: "info" }
            }
        });
        logger = log4js.getLogger("default");
    }
    return logger;
};

module.exports = {
    getLogger: getLogger
};