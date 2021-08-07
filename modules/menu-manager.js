const { app, Menu } = require("electron");

const wallpaperManager = require("./wallpaper-manager");
const eventbusManager = require("./eventbus-manager");

const init = () => {
    const template = [
        {
            label: app.getName(),
            submenu: [
                {
                    label: "Set Bing Wallpaper",
                    click: () => {
                        wallpaperManager.setBingWallpaper();
                    }
                },
                { type: "separator" },
                { role: "quit" }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Wallpaper",
                    click: () => {
                        eventbusManager.sendRendererMessage("showView", {
                            view: "wallpaper"
                        });
                    }
                }, {
                    label: "About",
                    click: () => {
                        eventbusManager.sendRendererMessage("showView", {
                            view: "about"
                        });
                    }
                },
                { type: "separator" },
                { role: "toggleDevTools" }
            ]
        },
    ]
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

module.exports = {
    init: init
};