import applicationUtils from "./application-utils.js";
import rendererEventbus from "./renderer-eventbus.js";

export default function () {
    return new Promise((resolve, reject) => {
        applicationUtils.loadTemplate(import.meta.url).then((template) => {
            resolve({
                template: template,
                methods: {
                    openDevTools() {
                        const message = {
                            action: "openDevTools"
                        };
                        rendererEventbus.executeDebugAction(message);
                    },
                    checkNewVersion() {
                        const message = {
                            action: "checkNewVersion"
                        };
                        rendererEventbus.executeDebugAction(message);
                    },
                    openUserFolder() {
                        const message = {
                            action: "openUserFolder"
                        };
                        rendererEventbus.executeDebugAction(message);
                    },
                    openTempFolder() {
                        const message = {
                            action: "openTempFolder"
                        };
                        rendererEventbus.executeDebugAction(message);
                    }
                }
            });
        });
    });
};