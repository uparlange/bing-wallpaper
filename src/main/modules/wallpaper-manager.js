const { app } = require("electron");
const electron = require("electron");
const htmlparser2 = require("htmlparser2");
const fetch = require("node-fetch");
const download = require("download");
const wallpaper = require("wallpaper");
const fs = require("fs");
const path = require("path");
const imageToBase64 = require("image-to-base64");

const loggerManager = require("./logger-manager");
const eventbusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");
const connectionManager = require("./connection-manager");

const BING_BASE_URL = "https://www.bing.com";
const BING_WALLPAPER_PATH = path.join(app.getPath("userData"), "bingWallpaper.jpg");
const USER_WALLPAPER_PATH = path.join(app.getPath("userData"), "userWallpaper.jpg");

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

const parsePage = (html, patternValidator) => {
    return new Promise((resolve, reject) => {
        let wallpaperUrl = null;
        const parser = new htmlparser2.Parser({
            onopentag(name, attributes) {
                const url = patternValidator(name, attributes);
                if (url != null) {
                    wallpaperUrl = url;
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

const setWallpaper = (path) => {
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
    return (isBingWallpaper() || isUserWallpaper());
};

const isBingWallpaper = () => {
    return (model.wallpaperPath == BING_WALLPAPER_PATH);
};

const isUserWallpaper = () => {
    return (model.wallpaperPath == USER_WALLPAPER_PATH);
};

const setB64Wallpaper = (b64Wallpaper) => {
    model.b64Wallpaper = b64Wallpaper;
    eventbusManager.sendRendererMessage("b64Wallpaper", model.b64Wallpaper);
};

const setRendererWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set Renderer Wallpaper");
    generateB64Wallpaper(model.wallpaperPath).then((data) => {
        setB64Wallpaper(data);
    });
};

const completeApplyWallpaper = () => {
    setWallpaper(model.wallpaperPath).then(() => {
        setRendererWallpaper();
    });
};

const setBingWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Set Bing Wallpaper");
    setB64Wallpaper(null);
    if (connectionManager.isOnLine()) {
        fetchPage(BING_BASE_URL).then((htmlContent) => {
            parsePage(htmlContent, bingImagePatternValidator).then((imageUrl) => {
                storageManager.setData("bingWallpaperUrl", imageUrl);
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

const setUserWallpaper = (path) => {
    loggerManager.getLogger().info("WallpaperManager - Set User Wallpaper");
    setB64Wallpaper(null);
    copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
        model.wallpaperPath = imagePath;
        loggerManager.getLogger().info("WallpaperManager - Apply User Wallpaper");
        completeApplyWallpaper();
    });
};

const bingWallpaperNeedUpdate = () => {
    const bingWallpaperUrl = storageManager.getData("bingWallpaperUrl");
    const bingWallpaperUrlDate = bingWallpaperUrl.date;
    const today = new Date();
    const bingWallpaperUrlDateIsToday = (
        bingWallpaperUrlDate.getFullYear() == today.getFullYear() &&
        bingWallpaperUrlDate.getMonth() == today.getMonth() &&
        bingWallpaperUrlDate.getDate() == today.getDate()
    );
    return !bingWallpaperUrlDateIsToday;
}

const checkWallpaper = () => {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    if (!isApplicationWallpaper() ||
        (isBingWallpaper() && bingWallpaperNeedUpdate())) {
        setBingWallpaper();
    } else {
        setRendererWallpaper();
    }
};

const init = () => {
    wallpaper.get().then((wallpaperPath) => {
        model.wallpaperPath = wallpaperPath;
        electron.powerMonitor.on("unlock-screen", () => {
            loggerManager.getLogger().info("WallpaperManager - PowerMonitor 'unlock-screen'");
            checkWallpaper();
        });
        connectionManager.onConnectionChanged((onLine) => {
            loggerManager.getLogger().info("WallpaperManager - Online '" + onLine + "'");
            checkWallpaper();
        });
        checkWallpaper();
    });
};

eventbusManager.onRendererInvoke("getB64Wallpaper", () => {
    return model.b64Wallpaper;
});
eventbusManager.onRendererMessage("setUserWallpaper", (path) => {
    setUserWallpaper(path);
});

module.exports = {
    init: init,
    setBingWallpaper: setBingWallpaper
};