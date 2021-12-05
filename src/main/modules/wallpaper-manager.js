const { app, screen } = require("electron");
const electron = require("electron");
const htmlparser2 = require("htmlparser2");
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
        iconFileName: "logo_bing.png",
        homeUrl: "https://www.bing.com",
        needPageParsing: true,
        imagePatternValidator: (name, attributes) => {
            // <link rel="preload" href="/th?id=OHR.SkyPool_FR-FR7548516899_1920x1080.jpg&amp;rf=LaDigue_1920x1080.jpg" as="image" id="preloadBg">
            if (name === "link" &&
                typeof (attributes.href) == "string" &&
                attributes.href.includes("id=OHR")) {
                return "https://www.bing.com" + attributes.href;
            }
            return null;
        }
    },
    {
        name: USER_SOURCE,
        iconFileName: "icon.png",
        separatorAfter: true
    },
    {
        name: "oceanexplorer",
        iconFileName: "logo_noaa.png",
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
let wallpaperModule = null;

function getLabelKey(source) {
    return source.toUpperCase() + "_WALLPAPER_SOURCE_LABEL"
};

function getMessage(source) {
    return {
        source: source.name,
        path: wallpaperPath,
        iconFileName: source.iconFileName,
        labelKey: getLabelKey(source.name),
        current: getCurrentSource() == source.name
    };
};

function getAvailableSources() {
    return sources.map((source) => {
        const message = getMessage(source);
        message.separatorAfter = source.separatorAfter;
        message.home = source.homeUrl;
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

function applyWallpaper(path) {
    return new Promise((resolve, reject) => {
        loggerManager.getLogger().info("WallpaperManager - Set wallpaper '" + path + "'");
        wallpaperModule.setWallpaper(path).then(() => {
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

function setUserWallpaper(path) {
    loggerManager.getLogger().info("WallpaperManager - Set " + USER_SOURCE.toUpperCase() + " Wallpaper");
    const finalizeSetUserWallpaper = (imagePath) => {
        loggerManager.getLogger().info("WallpaperManager - Apply " + USER_SOURCE.toUpperCase() + " Wallpaper");
        wallpaperPath = imagePath;
        completeApplyWallpaper();
    };
    if (path != null) {
        copyFile(path, USER_WALLPAPER_PATH).then((imagePath) => {
            finalizeSetUserWallpaper(imagePath);
        });
    } else {
        finalizeSetUserWallpaper(USER_WALLPAPER_PATH);
    }
};

function checkWallpaper() {
    loggerManager.getLogger().info("WallpaperManager - Check Wallpaper");
    let source = getSourceByPropertyAndValue("wallpaperPath", wallpaperPath);
    if (source != null) {
        setSource(source.name);
    } else {
        fs.access(USER_WALLPAPER_PATH, fs.constants.F_OK, (err) => {
            if (err) {
                copyFile(wallpaperPath, USER_WALLPAPER_PATH);
                setSource(USER_SOURCE);
                setSource(BING_SOURCE);
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
    import("wallpaper").then(module => {
        wallpaperModule = module;
        wallpaperModule.getWallpaper().then((path) => {
            wallpaperPath = path;
            checkWallpaper();
            loggerManager.getLogger().info("WallpaperManager - Init : OK");
        });
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

module.exports = {
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