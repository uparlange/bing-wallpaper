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
const eventBusManager = require("./eventbus-manager");
const storageManager = require("./storage-manager");

const BING_BASE_URL = "https://www.bing.com";
const BING_WALLPAPER_PATH = path.join(app.getPath("userData"), "bingWallpaper.jpg");
const USER_WALLPAPER_PATH = path.join(app.getPath("userData"), "userWallpaper.jpg");

const model = {
    bingWallpaperUrl: null,
    wallpaperPath: null,
    b64Wallpaper: null
};

const parseBingPage = (html) => {
    return new Promise((resolve, reject) => {
        let wallpaperUrl = null;
        const parser = new htmlparser2.Parser({
            onopentag(name, attributes) {
                // <link rel="preload" href="/th?id=OHR.SkyPool_FR-FR7548516899_1920x1080.jpg&amp;rf=LaDigue_1920x1080.jpg" as="image" id="preloadBg">
                if (name === "link" &&
                    typeof (attributes.href) == "string" &&
                    attributes.href.indexOf("id=OHR") != -1) {
                    wallpaperUrl = BING_BASE_URL + attributes.href;
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

const fetchBingPage = () => {
    return new Promise((resolve, reject) => {
        fetch(BING_BASE_URL)
            .then(res => res.text())
            .then(body => resolve(body));
    });
};

const downloadBingImage = (url) => {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(BING_WALLPAPER_PATH);
        ws.on("finish", () => {
            resolve(BING_WALLPAPER_PATH);
        });
        loggerManager.getLogger().info("WallpaperManager - Download image : " + url);
        download(url).pipe(ws);
    });
};

const setWallpaper = (path) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set wallpaper : " + path);
        wallpaper.set(path).then(() => {
            resolve(path);
        });
    });
};

const generateB64Wallpaper = (path) => {
    return new Promise((resolve, reject) => {
        imageToBase64(path).then((response) => {
            resolve(response);
        }).catch((error) => {
            loggerManager.getLogger().error("WallpaperManager - Generate b64 Wallpaper : " + error);
        });
    });
};

const copyFile = (source, destination) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("Copy file " + source + " to " + destination);
        fs.copyFile(source, destination, (err) => {
            if (err) {
                loggerManager.getLogger().error("WallpaperManager - Copy file " + source + " to " + destination + " : " + err);
                reject();
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
    eventBusManager.sendRendererMessage("b64Wallpaper", model.b64Wallpaper);
};

const completeApplyWallpaper = () => {
    return new Promise((resolve, reject) => {
        setWallpaper(model.wallpaperPath).then((imagePath) => {
            generateB64Wallpaper(imagePath).then((data) => {
                setB64Wallpaper(data);
                resolve();
            });
        });
    });
};

const applyBingWallpaper = () => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Apply Bing Wallpaper");
        completeApplyWallpaper().then(() => {
            resolve();
        });
    });
};

const setBingWallpaper = () => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set Bing Wallpaper");
        setB64Wallpaper(null);
        fetchBingPage().then((htmlContent) => {
            parseBingPage(htmlContent).then((imageUrl) => {
                model.bingWallpaperUrl = imageUrl;
                storageManager.setData("bingWallpaperUrl", imageUrl);
                downloadBingImage(imageUrl).then((imagePath) => {
                    model.wallpaperPath = imagePath;
                    applyBingWallpaper().then(() => {
                        resolve();
                    });
                });
            });
        });
    });
};

const applyUserWallpaper = () => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Apply User Wallpaper");
        completeApplyWallpaper().then(() => {
            resolve();
        });
    });
};

const setUserWallpaper = (path) => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set User Wallpaper");
        setB64Wallpaper(null);
        copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
            model.wallpaperPath = imagePath;
            applyUserWallpaper().then(() => {
                resolve();
            });
        });
    });
};

const checkWallpaper = () => {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
        if (isApplicationWallpaper()) {
            loggerManager.getLogger().info("WallpaperManager - Application Wallpaper managed !");
            if (isBingWallpaper()) {
                applyBingWallpaper().then(() => {
                    resolve();
                });
            } else {
                applyUserWallpaper().then(() => {
                    resolve();
                });
            }
        } else {
            setBingWallpaper().then(() => {
                resolve();
            });
        }
    });
};

const init = () => {
    return new Promise((resolve, reject) => {
        wallpaper.get().then((wallpaperPath) => {
            model.wallpaperPath = wallpaperPath;
            model.bingWallpaperUrl = storageManager.getData("bingWallpaperUrl").value;
            electron.powerMonitor.on("unlock-screen", () => {
                loggerManager.getLogger().info("WallpaperManager - PowerMonitor : unlock-screen");
                checkWallpaper();
            });
            checkWallpaper().then(() => {
                resolve();
            });
        });
    });
};

const getB64Wallpaper = () => {
    return model.b64Wallpaper;
};

module.exports = {
    init: init,
    getB64Wallpaper: getB64Wallpaper,
    setBingWallpaper: setBingWallpaper,
    setUserWallpaper: setUserWallpaper
};