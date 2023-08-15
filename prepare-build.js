const fs = require("fs-extra");

fs.removeSync("./build");

fs.ensureDirSync("./build");

fs.copySync("./src/renderer", "./build/renderer");
fs.copySync("./src/resources", "./build/resources");
fs.copySync("./build/resources/images/icon.png", "./build/icon.png");