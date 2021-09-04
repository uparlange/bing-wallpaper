const { app } = require("electron");
const electron = require("electron");
const htmlparser2 = require("htmlparser2");
const fetch = require("node-fetch");
const download = require("download");
const wallpaper = require("wallpaper");
const fs = require("fs");
const path = require("path");
const imageToBase64 = require("image-to-base64");
const EventEmitter = require("events");

const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const connectionManager = require("./connection-manager");

const eventEmitter = new EventEmitter();

const BING_SOURCE = "bing";
const BING_BASE_URL = "https://www.bing.com";
const BING_WALLPAPER_PATH = path.join(app.getPath("userData"), "bingWallpaper.jpg");
const BING_WALLPAPER_STORAGE_KEY = "bingWallpaperUrl";

const USER_SOURCE = "user";
const USER_WALLPAPER_PATH = path.join(app.getPath("userData"), "userWallpaper.jpg");

const NATIONAL_GEOGRAPHIC_SOURCE = "nationalGeographic";
const NATIONAL_GEOGRAPHIC_BASE_URL = "https://www.nationalgeographic.fr/photo-du-jour";
const NATIONAL_GEOGRAPHIC_WALLPAPER_PATH = path.join(app.getPath("userData"), "nationalGeographicWallpaper.jpg");
const NATIONAL_GEOGRAPHIC_STORAGE_KEY = "nationalGeographicWallpaperUrl";

const model = {
    wallpaperPath: null,
    b64Wallpaper: null
};

// <link rel="preload" href="/th?id=OHR.SkyPool_FR-FR7548516899_1920x1080.jpg&amp;rf=LaDigue_1920x1080.jpg" as="image" id="preloadBg">
const bingImagePatternValidator = (name, attributes) => {
    if (name === "link" &&
        typeof (attributes.href) == "string" &&
        attributes.href.indexOf("id=OHR") != -1) {
        return BING_BASE_URL + attributes.href;
    }
    return null;
};

// <img src="https://static.nationalgeographic.fr/files/styles/image_3200/public/pod_310821.jpg?w=1190&amp;h=801" width="1190" height="801" alt="À la frontière" title="À la frontière" loading="lazy">
const nationalGeographicImagePatternValidator = (name, attributes) => {
    if (name === "img") {
        return attributes.src;
    }
    return null;
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
        fetch(url)
            .then(res => res.text())
            .then(body => resolve(body));
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

const isApplicationWallpaper = () => {
    return (isBingWallpaper() || isNationalGeographicWallpaper() || isUserWallpaper());
};

const isBingWallpaper = () => {
    return (model.wallpaperPath == BING_WALLPAPER_PATH);
};

const isUserWallpaper = () => {
    return (model.wallpaperPath == USER_WALLPAPER_PATH);
};

const isNationalGeographicWallpaper = () => {
    return (model.wallpaperPath == NATIONAL_GEOGRAPHIC_WALLPAPER_PATH);
};

const setB64Wallpaper = (b64Wallpaper) => {
    model.b64Wallpaper = b64Wallpaper;
    eventbusManager.sendRendererMessage("b64Wallpaper", model.b64Wallpaper);
};

const setRendererWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set Renderer Wallpaper");
    eventEmitter.emit("wallpaperChanged", getCurrentWallpaperSource());
    generateB64Wallpaper(model.wallpaperPath).then((data) => {
        setB64Wallpaper(data);
    });
};

const completeApplyWallpaper = () => {
    applyWallpaper(model.wallpaperPath).then(() => {
        setRendererWallpaper();
    });
};

const setBingWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set Bing Wallpaper");
    setB64Wallpaper(null);
    if (connectionManager.isOnLine()) {
        fetchPage(BING_BASE_URL).then((htmlContent) => {
            parsePage(htmlContent, bingImagePatternValidator).then((imageUrl) => {
                storageManager.setData(BING_WALLPAPER_STORAGE_KEY, imageUrl);
                downloadImage(imageUrl, BING_WALLPAPER_PATH).then((imagePath) => {
                    model.wallpaperPath = imagePath;
                    loggerManager.getLogger().info("WallpaperManager - Apply Bing Wallpaper");
                    completeApplyWallpaper();
                });
            });
        });
    } else {
        loggerManager.getLogger().error("WallpaperManager - No connection available");
        completeApplyWallpaper();
    }
};

const setNationalGeographicWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set National Geographic Wallpaper");
    setB64Wallpaper(null);
    if (connectionManager.isOnLine()) {
        fetchPage(NATIONAL_GEOGRAPHIC_BASE_URL).then((htmlContent) => {
            parsePage(htmlContent, nationalGeographicImagePatternValidator).then((imageUrl) => {
                storageManager.setData(NATIONAL_GEOGRAPHIC_STORAGE_KEY, imageUrl);
                downloadImage(imageUrl, NATIONAL_GEOGRAPHIC_WALLPAPER_PATH).then((imagePath) => {
                    model.wallpaperPath = imagePath;
                    loggerManager.getLogger().info("WallpaperManager - Apply Bing Wallpaper");
                    completeApplyWallpaper();
                });
            });
        });
    } else {
        loggerManager.getLogger().error("WallpaperManager - No connection available");
        completeApplyWallpaper();
    }
};

const setUserWallpaper = (path) => {
    loggerManager.getLogger().info("WallpaperManager - Set User Wallpaper");
    setB64Wallpaper(null);
    if (path != null) {
        copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
            model.wallpaperPath = imagePath;
            loggerManager.getLogger().info("WallpaperManager - Apply User Wallpaper");
            completeApplyWallpaper();
        });
    } else {
        fs.access(USER_WALLPAPER_PATH, fs.constants.F_OK, (err) => {
            if (!err) {
                model.wallpaperPath = USER_WALLPAPER_PATH;
                loggerManager.getLogger().info("WallpaperManager - Apply User Wallpaper");
                completeApplyWallpaper();
            }
        });
    }
};

const wallpaperNeedUpdate = (key) => {
    const wallpaperUrl = storageManager.getData(key);
    const wallpaperUrlDate = wallpaperUrl.date;
    const today = new Date();
    const wallpaperUrlDateIsToday = (
        wallpaperUrlDate.getFullYear() == today.getFullYear() &&
        wallpaperUrlDate.getMonth() == today.getMonth() &&
        wallpaperUrlDate.getDate() == today.getDate()
    );
    return !wallpaperUrlDateIsToday;
}

const checkWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    if (isApplicationWallpaper()) {
        if (isBingWallpaper() && wallpaperNeedUpdate(BING_WALLPAPER_STORAGE_KEY)) {
            setWallpaper(BING_SOURCE);
        } else if (isNationalGeographicWallpaper() && wallpaperNeedUpdate(NATIONAL_GEOGRAPHIC_STORAGE_KEY)) {
            setWallpaper(NATIONAL_GEOGRAPHIC_SOURCE);
        } else {
            setRendererWallpaper();
        }
    } else {
        fs.access(USER_WALLPAPER_PATH, fs.constants.F_OK, (err) => {
            if (err) {
                copyFile(model.wallpaperPath, USER_WALLPAPER_PATH);
                setWallpaper(BING_SOURCE);
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
        checkWallpaper();
    });
};

const getAvailableWallpaperSources = () => {
    return [BING_SOURCE, NATIONAL_GEOGRAPHIC_SOURCE, USER_SOURCE];
};

const getCurrentWallpaperSource = () => {
    if (isBingWallpaper()) {
        return BING_SOURCE;
    } else if (isNationalGeographicWallpaper()) {
        return NATIONAL_GEOGRAPHIC_SOURCE;
    } else if (isUserWallpaper()) {
        return USER_SOURCE;
    }
    return null;
};

const setWallpaper = (source) => {
    switch (source) {
        case BING_SOURCE: setBingWallpaper(); break;
        case NATIONAL_GEOGRAPHIC_SOURCE: setNationalGeographicWallpaper(); break;
        case USER_SOURCE: setUserWallpaper(); break
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
    setWallpaper: setWallpaper,
    getB64Wallpaper: getB64Wallpaper,
    getAvailableWallpaperSources: getAvailableWallpaperSources,
    getCurrentWallpaperSource: getCurrentWallpaperSource,
    setUserWallpaper: setUserWallpaper,
    onWallpaperChanged: onWallpaperChanged
};