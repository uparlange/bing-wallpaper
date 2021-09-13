const { app, screen } = require("electron");
const electron = require("electron");
const htmlparser2 = require("htmlparser2");
const fetch = require("node-fetch");
const download = require("download");
const wallpaper = require("wallpaper");
const fs = require("fs");
const path = require("path");
const imageToBase64 = require("image-to-base64");
const dayjs = require("dayjs");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const connectionManager = require("./connection-manager");
const i18nManager = require("./i18n-manager");

const eventEmitter = new EventEmitter();

const BING_SOURCE = "bing";
const USER_SOURCE = "user";
let USER_WALLPAPER_PATH = null;

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
        get imageUrl() {
            //https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20210911-hires.jpg
            return "https://oceanexplorer.noaa.gov/multimedia/daily-image/media/" + dayjs().format("YYYYMMDD") + "-hires.jpg";
        },
        needPageParsing: false
    },
    {
        name: "bonjourmadame",
        get daySuffix() {
            let date = dayjs().date();
            if (dayjs().day() == 6) {
                date -= 1;
            } else if (dayjs().day() == 0) {
                date -= 2;
            }
            return ("0" + date).slice(-2);
        },
        get homeUrl() {
            // https://www.bonjourmadame.fr/2021/09/10/
            return "https://www.bonjourmadame.fr/" + dayjs().format("YYYY/MM/") + this.daySuffix + "/";
        },
        get imageUrl() {
            // https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210910-scaled.jpg?resize=2560
            const { width } = screen.getPrimaryDisplay().workAreaSize
            return "https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/" + dayjs().format("YYYY/MM/YYMM") + this.daySuffix + ".jpg?resize=" + width;
        },
        needPageParsing: false
    },
    {
        name: USER_SOURCE
    }
];
sources.forEach(element => {
    element.wallpaperPath = path.join(app.getPath("userData"), element.name + "Wallpaper.jpg");
    element.wallpaperStorageKey = element.name + "WallpaperUrl";
    if (element.name == USER_SOURCE) {
        USER_WALLPAPER_PATH = element.wallpaperPath;
    }
});

const model = {
    wallpaperPath: null,
    b64Wallpaper: null
};

const getSourceDescriptions = () => {
    return sources.map((element) => {
        return {
            name: element.name,
            key: element.name.toUpperCase() + "_WALLPAPER_SOURCE_LABEL",
            home: element.homeUrl,
            current: getCurrentSource() == element.name
        };
    })
};

const getSourceByPropertyAndValue = (property, value) => {
    let config = null;
    sources.forEach(element => {
        if (element[property] == value) {
            config = element;
            return;
        }
    });
    return config;
};

const parsePage = (html, patternValidator) => {
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

const fetchPage = (url) => {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.text()).then(text => resolve(text));
    });
};

const downloadImage = (url, destination) => {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(destination);
        ws.on("finish", () => {
            resolve(destination);
        });
        loggerManager.getLogger().info("WallpaperManager - Download image '" + url + "'");
        download(url).pipe(ws);
    });
};

const applyWallpaper = (path) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set wallpaper '" + path + "'");
        wallpaper.set(path).then(() => {
            resolve(path);
        });
    });
};

const generateB64Wallpaper = (path) => {
    return new Promise((resolve, reject) => {
        imageToBase64(path).then((response) => {
            resolve(response);
        }).catch((err) => {
            loggerManager.getLogger().error("WallpaperManager - Generate b64 Wallpaper '" + err + "'");
            resolve(null);
        });
    });
};

const copyFile = (source, destination) => {
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

const setB64Wallpaper = (b64Wallpaper) => {
    model.b64Wallpaper = b64Wallpaper;
    eventbusManager.sendRendererMessage("b64WallpaperChanged", model.b64Wallpaper);
};

const setRendererWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set Renderer Wallpaper");
    eventbusManager.sendRendererMessage("wallpaperChanged", getCurrentSource());
    eventEmitter.emit("wallpaperChanged", getCurrentSource());
    generateB64Wallpaper(model.wallpaperPath).then((data) => {
        setB64Wallpaper(data);
    });
};

const completeApplyWallpaper = () => {
    applyWallpaper(model.wallpaperPath).then(() => {
        setRendererWallpaper();
    });
};

const setExternalWallpaper = (config) => {
    loggerManager.getLogger().info("WallpaperManager - Set " + config.name.toUpperCase() + " Wallpaper");
    setB64Wallpaper(null);
    const finalizeSetExternalWallpaper = (imageUrl) => {
        storageManager.setData(config.wallpaperStorageKey, imageUrl);
        downloadImage(imageUrl, config.wallpaperPath).then((imagePath) => {
            model.wallpaperPath = imagePath;
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

const setUserWallpaper = (path) => {
    loggerManager.getLogger().info("WallpaperManager - Set " + USER_SOURCE.toUpperCase() + " Wallpaper");
    setB64Wallpaper(null);
    const finalizeSetUserWallpaper = () => {
        loggerManager.getLogger().info("WallpaperManager - Apply " + USER_SOURCE.toUpperCase() + " Wallpaper");
        completeApplyWallpaper();
    };
    if (path != null) {
        copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
            model.wallpaperPath = imagePath;
            finalizeSetUserWallpaper();
        });
    } else {
        model.wallpaperPath = USER_WALLPAPER_PATH;
        finalizeSetUserWallpaper();
    }
};

const externalWallpaperNeedUpdate = (key) => {
    const wallpaperUrl = storageManager.getData(key);
    return dayjs(wallpaperUrl.date).format("YYYYMMDD") != dayjs(new Date()).format("YYYYMMDD");
}

const checkWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    let config = getSourceByPropertyAndValue("wallpaperPath", model.wallpaperPath);
    if (config != null) {
        if (config.name != USER_SOURCE && externalWallpaperNeedUpdate(config.wallpaperStorageKey)) {
            setExternalWallpaper(config);
        } else {
            setRendererWallpaper();
        }
    } else {
        fs.access(USER_WALLPAPER_PATH, fs.constants.F_OK, (err) => {
            if (err) {
                copyFile(model.wallpaperPath, USER_WALLPAPER_PATH);
                config = getSourceByPropertyAndValue("name", BING_SOURCE);
                setExternalWallpaper(config);
            }
        });
    }
};

const init = () => {
    electron.powerMonitor.on("unlock-screen", () => {
        loggerManager.getLogger().info("WallpaperManager - PowerMonitor 'unlock-screen'");
        checkWallpaper();
    });
    connectionManager.onConnectionChanged((onLine) => {
        loggerManager.getLogger().info("WallpaperManager - Online '" + onLine + "'");
        checkWallpaper();
    });
    wallpaper.get().then((wallpaperPath) => {
        model.wallpaperPath = wallpaperPath;
        loggerManager.getLogger().info("WallpaperManager - Init : OK");
        checkWallpaper();
    });
};

const getAvailableSources = () => {
    return sources.map((element) => {
        return element.name;
    });
};

const getCurrentSource = () => {
    const config = getSourceByPropertyAndValue("wallpaperPath", model.wallpaperPath);
    return config ? config.name : null;
};

const setSource = (source) => {
    const config = getSourceByPropertyAndValue("name", source);
    if (config.name == USER_SOURCE) {
        setUserWallpaper();
    } else {
        setExternalWallpaper(config);
    }
};

const getB64Wallpaper = () => {
    return model.b64Wallpaper;
};

const onWallpaperChanged = (callback) => {
    eventEmitter.on("wallpaperChanged", callback);
};

module.exports = {
    init: init,
    setSource: setSource,
    getCurrentSource: getCurrentSource,
    getB64Wallpaper: getB64Wallpaper,
    getAvailableSources: getAvailableSources,
    getSourceDescriptions: getSourceDescriptions,
    setUserWallpaper: setUserWallpaper,
    onWallpaperChanged: onWallpaperChanged
};