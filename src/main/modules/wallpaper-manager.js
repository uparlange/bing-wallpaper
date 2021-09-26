const { app, screen } = require("electron");
const electron = require("electron");
const htmlparser2 = require("htmlparser2");
const wallpaper = require("wallpaper");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const connectionManager = require("./connection-manager");
const applicationManager = require("./application-manager");
const historyManager = require("./history-manager");

const eventEmitter = new EventEmitter();

const BING_SOURCE = "bing";
const USER_SOURCE = "user";

const sources = [
    {
        name: BING_SOURCE,
        homeUrl: "https://www.bing.com",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <link rel="preload" href="/th?id=OHR.SkyPool_FR-FR7548516899_1920x1080.jpg&amp;rf=LaDigue_1920x1080.jpg" as="image" id="preloadBg">
            if (name === "link" &&
                typeof (attributes.href) == "string" &&
                attributes.href.indexOf("id=OHR") != -1) {
                return "https://www.bing.com" + attributes.href;
            }
            return null;
        }
    },
    {
        name: "oceanexplorer",
        get homeUrl() {
            // https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20210912.html
            return "https://oceanexplorer.noaa.gov/multimedia/daily-image/media/" + dayjs().format("YYYYMMDD") + ".html"
        },
        needPageParsing: false,
        get imageUrl() {
            //https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20210911-hires.jpg
            return "https://oceanexplorer.noaa.gov/multimedia/daily-image/media/" + dayjs().format("YYYYMMDD") + "-hires.jpg";
        }
    },
    {
        name: "bonjourmadame",
        homeUrl: "https://www.bonjourmadame.fr/",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <img loading="eager" class="alignnone wp-image-3325 size-full jetpack-lazy-image jetpack-lazy-image--handled" src="https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=960%2C1428" alt="" width="960" height="1428" data-recalc-dims="1" srcset="https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?w=1070&amp;ssl=1 1070w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=202%2C300&amp;ssl=1 202w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=688%2C1024&amp;ssl=1 688w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=768%2C1143&amp;ssl=1 768w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=1032%2C1536&amp;ssl=1 1032w" data-lazy-loaded="1" sizes="(max-width: 960px) 100vw, 960px">
            if (name === "img" && attributes.class && attributes.class.includes("size-full")) {
                const { width } = screen.getPrimaryDisplay().workAreaSize
                const url = attributes.src.split("?")[0] + "?resize=" + width;
                return url;
            }
            return null;
        }
    },
    {
        name: USER_SOURCE
    }
];

let USER_WALLPAPER_PATH = null;

sources.forEach(element => {
    element.wallpaperPath = path.join(app.getPath("userData"), element.name + "Wallpaper.jpg");
    element.wallpaperStorageKey = element.name + "WallpaperUrl";
    if (element.name == USER_SOURCE) {
        USER_WALLPAPER_PATH = element.wallpaperPath;
    }
});

let wallpaperPath = null;

function getSourceDescriptions() {
    return sources.map((element) => {
        return {
            name: element.name,
            key: element.name.toUpperCase() + "_WALLPAPER_SOURCE_LABEL",
            home: element.homeUrl,
            current: getCurrentSource() == element.name
        };
    })
};

function getSourceByPropertyAndValue(property, value) {
    let config = null;
    sources.forEach(element => {
        if (element[property] == value) {
            config = element;
            return;
        }
    });
    return config;
};

function parsePage(html, patternValidator) {
    return new Promise((resolve, reject) => {
        let wallpaperUrl = null;
        const parser = new htmlparser2.Parser({
            onopentag(name, attributes) {
                if (wallpaperUrl == null) {
                    const url = patternValidator(name, attributes);
                    if (url != null) {
                        wallpaperUrl = url;
                    }
                }
            },
            onend() {
                resolve(wallpaperUrl);
            }
        });
        parser.write(html);
        parser.end();
    });
};

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        applicationManager.fetch(url).then((res) => {
            resolve(res);
        });
    });
};

function applyWallpaper(path) {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set wallpaper '" + path + "'");
        wallpaper.set(path).then(() => {
            resolve(path);
        });
    });
};

function copyFile(source, destination) {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("Copy file " + source + " to " + destination);
        fs.copyFile(source, destination, (err) => {
            if (err) {
                loggerManager.getLogger().error("WallpaperManager - Copy file '" + source + "' to '" + destination + "', '" + err + "'");
                resolve(null);
            } else {
                resolve(destination);
            }
        });
    });
};

function setRendererWallpaper() {
    loggerManager.getLogger().info("WallpaperManager - Set Renderer Wallpaper");
    const message = {
        source: getCurrentSource(),
        path: wallpaperPath
    };
    eventbusManager.sendRendererMessage("wallpaperChanged", message);
    eventEmitter.emit("wallpaperChanged", message);
    historyManager.addItem(message);
};

function completeApplyWallpaper() {
    applyWallpaper(wallpaperPath).then(() => {
        setRendererWallpaper();
    });
};

function setExternalWallpaper(config) {
    loggerManager.getLogger().info("WallpaperManager - Set " + config.name.toUpperCase() + " Wallpaper");
    const finalizeSetExternalWallpaper = (imageUrl) => {
        storageManager.setData(config.wallpaperStorageKey, imageUrl);
        applicationManager.download(imageUrl, config.wallpaperPath).then((imagePath) => {
            wallpaperPath = imagePath;
            loggerManager.getLogger().info("WallpaperManager - Apply " + config.name.toUpperCase() + " Wallpaper");
            completeApplyWallpaper();
        });
    };
    if (connectionManager.isOnLine()) {
        if (config.needPageParsing) {
            fetchPage(config.homeUrl).then((htmlContent) => {
                parsePage(htmlContent, config.imagePatternValidator).then((imageUrl) => {
                    finalizeSetExternalWallpaper(imageUrl);
                });
            });
        } else {
            finalizeSetExternalWallpaper(config.imageUrl);
        }
    } else {
        completeApplyWallpaper();
    }
};

function setUserWallpaper(path) {
    loggerManager.getLogger().info("WallpaperManager - Set " + USER_SOURCE.toUpperCase() + " Wallpaper");
    const finalizeSetUserWallpaper = () => {
        loggerManager.getLogger().info("WallpaperManager - Apply " + USER_SOURCE.toUpperCase() + " Wallpaper");
        completeApplyWallpaper();
    };
    if (path != null) {
        copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
            wallpaperPath = imagePath;
            finalizeSetUserWallpaper();
        });
    } else {
        wallpaperPath = USER_WALLPAPER_PATH;
        finalizeSetUserWallpaper();
    }
};

function externalWallpaperNeedUpdate(key) {
    const wallpaperUrl = storageManager.getData(key);
    return dayjs(wallpaperUrl.date).format("YYYYMMDD") != dayjs(new Date()).format("YYYYMMDD");
}

function checkWallpaper() {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    let config = getSourceByPropertyAndValue("wallpaperPath", wallpaperPath);
    if (config != null) {
        if (config.name != USER_SOURCE && externalWallpaperNeedUpdate(config.wallpaperStorageKey)) {
            setExternalWallpaper(config);
        } else {
            setRendererWallpaper();
        }
    } else {
        fs.access(USER_WALLPAPER_PATH, fs.constants.F_OK, (err) => {
            if (err) {
                copyFile(wallpaperPath, USER_WALLPAPER_PATH);
                config = getSourceByPropertyAndValue("name", BING_SOURCE);
                setExternalWallpaper(config);
            }
        });
    }
};

function init() {
    electron.powerMonitor.on("unlock-screen", () => {
        loggerManager.getLogger().info("WallpaperManager - PowerMonitor 'unlock-screen'");
        checkWallpaper();
    });
    connectionManager.onConnectionChanged((onLine) => {
        loggerManager.getLogger().info("WallpaperManager - Online '" + onLine + "'");
        checkWallpaper();
    });
    wallpaper.get().then((path) => {
        wallpaperPath = path;
        checkWallpaper();
        loggerManager.getLogger().info("WallpaperManager - Init : OK");
    });
};

function getAvailableSources() {
    return sources.map((element) => {
        return element.name;
    });
};

function getCurrentSource() {
    const config = getSourceByPropertyAndValue("wallpaperPath", wallpaperPath);
    return config ? config.name : null;
};

function setSource(source) {
    const config = getSourceByPropertyAndValue("name", source);
    if (config.name == USER_SOURCE) {
        setUserWallpaper();
    } else {
        setExternalWallpaper(config);
    }
};

function onWallpaperChanged(callback) {
    eventEmitter.on("wallpaperChanged", callback);
};

function getCurrentWallpaperPath() {
    return wallpaperPath;
};

module.exports = {
    init: init,
    setSource: setSource,
    getCurrentWallpaperPath: getCurrentWallpaperPath,
    getCurrentSource: getCurrentSource,
    getAvailableSources: getAvailableSources,
    getSourceDescriptions: getSourceDescriptions,
    setUserWallpaper: setUserWallpaper,
    onWallpaperChanged: onWallpaperChanged
};