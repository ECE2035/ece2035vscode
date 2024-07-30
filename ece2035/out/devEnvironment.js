"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpDevEnvironment = void 0;
const path = require("path");
const fs = require("fs");
function setUpDevEnvironment(context, targetDir) {
    // Copies the /src/exampleProject folder into the target directory
    const exampleProjectPath = path.join(context.extensionPath, "assets", "exampleProject");
    const targetProjectPath = targetDir;
    // Copy the example project
    copyFolderRecursiveSync(exampleProjectPath, targetProjectPath);
}
exports.setUpDevEnvironment = setUpDevEnvironment;
function copyFileSync(source, target) {
    let targetFile = target;
    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target) {
    let files = [];
    // Check if folder needs to be created or integrated
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }
    // Copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            let curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, path.join(target, file));
            }
            else {
                copyFileSync(curSource, target);
            }
        });
    }
}
//# sourceMappingURL=devEnvironment.js.map