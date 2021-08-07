const { app, Menu } = require("electron");
const wallpaperManager = require("./wallpaper-manager");

const init = () => {
    const template = [
        {
            label: app.getName(),
            submenu: [
                { role: "quit" }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Set Bing Wallpaper",
                    click: () => {
                        wallpaperManager.setBingWallpaper();
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