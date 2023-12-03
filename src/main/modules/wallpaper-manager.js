import { app, screen } from "electron";
import { getWallpaper, setWallpaper } from "wallpaper";
import electron from "electron";
import * as htmlparser2 from "htmlparser2";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import EventEmitter from "events";

import loggerManager from "./logger-manager";
import eventbusManager from "./eventbus-manager";
import storageManager from "./storage-manager";
import connectionManager from "./connection-manager";
import applicationManager from "./application-manager";
import historyManager from "./history-manager";

const eventEmitter = new EventEmitter();

const BING_SOURCE = "bing";
const USER_SOURCE = "user";

const sources = [
    {
        name: BING_SOURCE,
        iconFileName: "logo_bing.png",
        homeUrl: "https://www.bing.com",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <meta property="og:image" content="https://www.bing.com/th?id=OHR.WildLupine_FR-FR0066475130_tmb.jpg&amp;rf=">
            if (name === "meta" && attributes.property == "og:image") {
                return attributes.content;
            }
            return null;
        }
    },
    {
        name: USER_SOURCE,
        iconFileName: "icon.png",
        homeUrl: null,
        separatorAfter: true
    },
    {
        name: "oceanexplorer",
        iconFileName: "logo_noaa.png",
        get homeUrl() {
            // https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20210912.html
            // @TODO force 2021 until new screenshots are available in 2022
            return "https://oceanexplorer.noaa.gov/multimedia/daily-image/media/2021" + dayjs().format("MMDD") + ".html"
        },
        needPageParsing: false,
        get imageUrl() {
            //https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20210911-hires.jpg
            // @TODO force 2021 until new screenshots are available in 2022
            return "https://oceanexplorer.noaa.gov/multimedia/daily-image/media/2021" + dayjs().format("MMDD") + "-hires.jpg";
        }
    },
    {
        name: "apod",
        iconFileName: "logo_nasa.png",
        homeUrl: "https://apod.nasa.gov/apod/",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <a href="image/2109/AldrinVisor_Apollo11_4096.jpg"></a>
            if (name === "a" && attributes.href.includes("image/")) {
                return "https://apod.nasa.gov/apod/" + attributes.href;
                // <iframe width="960" height="540" src="https://www.youtube.com/embed/tLC6Sy8f06s?rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
            } else if (name == "iframe" && attributes.src.includes("youtube")) {
                const videoId = attributes.src.substring(attributes.src.lastIndexOf("/") + 1, attributes.src.indexOf("?"));
                const imageUrls = [
                    "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg",
                    "https://img.youtube.com/vi/" + videoId + "/sddefault.jpg"
                ];
                return (async () => {
                    for (let imageUrl of imageUrls) {
                        const test = await applicationManager.download({ url: imageUrl });
                        if (test) {
                            return imageUrl;
                        }
                    }
                })();
            }
        }
    },
    {
        name: "bonjourmadame",
        iconFileName: "logo_bonjourmadame.png",
        homeUrl: "https://www.bonjourmadame.fr/",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <img loading="eager" class="alignnone wp-image-3325 size-full jetpack-lazy-image jetpack-lazy-image--handled" src="https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=960%2C1428" alt="" width="960" height="1428" data-recalc-dims="1" srcset="https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?w=1070&amp;ssl=1 1070w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=202%2C300&amp;ssl=1 202w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=688%2C1024&amp;ssl=1 688w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=768%2C1143&amp;ssl=1 768w, https://i2.wp.com/bonjourmadame.fr/wp-content/uploads/2021/09/210916-1.jpg?resize=1032%2C1536&amp;ssl=1 1032w" data-lazy-loaded="1" sizes="(max-width: 960px) 100vw, 960px">
            if (name === "img" && attributes.class && attributes.class.includes("size")) {
                const { width } = screen.getPrimaryDisplay().workAreaSize
                const url = attributes.src.split("?")[0] + "?resize=" + width;
                return url;
            }
            return null;
        }
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

function getLabelKey(source) {
    return source.toUpperCase() + "_WALLPAPER_SOURCE_LABEL"
};

function getMessage(source) {
    return {
        source: source.name,
        path: wallpaperPath,
        homeUrl: source.homeUrl,
        iconFileName: source.iconFileName,
        labelKey: getLabelKey(source.name),
        current: getCurrentSource() == source.name
    };
};

function getAvailableSources() {
    return sources.map((source) => {
        const message = getMessage(source);
        message.separatorAfter = source.separatorAfter;
        return message;
    });
};

function getSourceByPropertyAndValue(property, value) {
    let source = null;
    sources.forEach(element => {
        if (element[property] == value) {
            source = element;
            return;
        }
    });
    return source;
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
        applicationManager.download({
            url: url,
            resultDecoder: new TextDecoder("utf-8")
        }).then((res) => {
            resolve(res);
        });
    });
};

function applyWallpaper(filePath) {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set wallpaper '" + filePath + "'");
        setWallpaper(filePath).then(() => {
            resolve(filePath);
        }).catch((err) => {
            resolve(filePath);
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
    const message = getCurrentWallpaperSource();
    eventbusManager.sendRendererMessage("wallpaperChanged", message);
    eventEmitter.emit("wallpaperChanged", message);
    historyManager.addItem(message);
};

function completeApplyWallpaper() {
    applyWallpaper(wallpaperPath).then(() => {
        setRendererWallpaper();
    });
};

function setExternalWallpaper(source) {
    loggerManager.getLogger().info("WallpaperManager - Set " + source.name.toUpperCase() + " Wallpaper");
    const finalizeSetUserWallpaper = (imagePath) => {
        loggerManager.getLogger().info("WallpaperManager - Apply " + source.name.toUpperCase() + " Wallpaper");
        wallpaperPath = imagePath;
        completeApplyWallpaper();
    };
    const downloadImage = (imageUrl) => {
        storageManager.setData(source.wallpaperStorageKey, imageUrl);
        applicationManager.download({
            url: imageUrl,
            destination: source.wallpaperPath
        }).then((imagePath) => {
            finalizeSetUserWallpaper(imagePath);
        });
    };
    const wallpaperUrl = storageManager.getData(source.wallpaperStorageKey);
    const wallpaperNeedUpdate = dayjs(wallpaperUrl.date).format("YYYYMMDD") != dayjs(new Date()).format("YYYYMMDD");
    if (wallpaperUrl.value == null || wallpaperNeedUpdate) {
        if (connectionManager.isOnLine()) {
            if (source.needPageParsing) {
                fetchPage(source.homeUrl).then((htmlContent) => {
                    parsePage(htmlContent, source.imagePatternValidator).then((imageUrl) => {
                        downloadImage(imageUrl);
                    });
                });
            } else {
                downloadImage(source.imageUrl);
            }
        }
    } else {
        finalizeSetUserWallpaper(source.wallpaperPath);
    }
};

function setUserWallpaper(filePath) {
    loggerManager.getLogger().info("WallpaperManager - Set " + USER_SOURCE.toUpperCase() + " Wallpaper");
    const finalizeSetUserWallpaper = (imagePath) => {
        loggerManager.getLogger().info("WallpaperManager - Apply " + USER_SOURCE.toUpperCase() + " Wallpaper");
        wallpaperPath = imagePath;
        completeApplyWallpaper();
    };
    if (filePath != null) {
        copyFile(filePath, USER_WALLPAPER_PATH).then((imagePath) => {
            finalizeSetUserWallpaper(imagePath);
        });
    } else {
        if (!fs.existsSync(USER_WALLPAPER_PATH)) {
            const defaultWallpaperPath = path.join(__dirname, "resources/", "images", "default.jpg");
            copyFile(defaultWallpaperPath, USER_WALLPAPER_PATH).then((imagePath) => {
                finalizeSetUserWallpaper(imagePath);
            });
        } else {
            finalizeSetUserWallpaper(USER_WALLPAPER_PATH)
        }
    }
};

function checkWallpaper() {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    let source = getSourceByPropertyAndValue("wallpaperPath", wallpaperPath);
    if (source != null) {
        setSource(source.name);
    } else {
        setUserWallpaper();
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
    getWallpaper().then((filePath) => {
        wallpaperPath = filePath;
        checkWallpaper();
        loggerManager.getLogger().info("WallpaperManager - Init : OK");
    }).catch((err) => {
        loggerManager.getLogger().error("WallpaperManager - Init : " + err);
    });
};

function getCurrentSource() {
    const source = getSourceByPropertyAndValue("wallpaperPath", wallpaperPath);
    return source ? source.name : null;
};

function showNextWallpaper() {
    const index = sources.findIndex((element) => element.name == getCurrentSource());
    const nextWallpaper = (index < (sources.length - 1)) ? sources[index + 1].name : sources[0].name;
    setSource(nextWallpaper);
};

function showPreviousWallpaper() {
    const index = sources.findIndex((element) => element.name == getCurrentSource());
    const previousWallpaper = (index > 0) ? sources[index - 1].name : sources[sources.length - 1].name;
    setSource(previousWallpaper);
};

function setSource(sourceName) {
    const source = getSourceByPropertyAndValue("name", sourceName);
    if (source.name == USER_SOURCE) {
        setUserWallpaper();
    } else {
        setExternalWallpaper(source);
    }
};

function onWallpaperChanged(callback) {
    eventEmitter.on("wallpaperChanged", callback);
};

function getCurrentWallpaperSource() {
    const source = getSourceByPropertyAndValue("name", getCurrentSource());
    return source ? getMessage(source) : {};
};

export default {
    init: init,
    setSource: setSource,
    getCurrentWallpaperSource: getCurrentWallpaperSource,
    getCurrentSource: getCurrentSource,
    getAvailableSources: getAvailableSources,
    setUserWallpaper: setUserWallpaper,
    showNextWallpaper: showNextWallpaper,
    showPreviousWallpaper: showPreviousWallpaper,
    onWallpaperChanged: onWallpaperChanged
};