import * as vscode from 'vscode';

import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { deactivateLanguageClient } from './languageClient/languageClient';

const baseUrl = "https://ece2035vscode.s3.us-east-2.amazonaws.com/";

export function checkDependencies(context : vscode.ExtensionContext) {
    getApi().then((api: any) => {
        // getting latest version string
        api.downloadFile(vscode.Uri.parse(baseUrl + "version.txt"), "riscv-version.txt", context).then((fileUri: vscode.Uri) => {
            // read the file
            let fs = require("fs");
            let version = fs.readFileSync(fileUri.fsPath, "utf8");
            if (version === context.globalState.get("riscvemulatorVersion")) {
                // no update available
                return;
            } else if (context.globalState.get("riscvemulatorVersion") === undefined) {
                // setting the version for the first time
                context.globalState.update("riscvemulatorVersion", version);
            }

            // prompt the user to update
            vscode.window.showInformationMessage("A new version of the RISC-V Emulator is available. Would you like to update?", "Yes", "No").then((value) => {
                if (value === "Yes") {
                    // download it - first must get the system type (OS and architecture)
                    // then download the correct file
                    let os = process.platform;
                    let arch = process.arch;
                    let exten = "";

                    let url = baseUrl + "riscvemulator-";
                    if (os === "win32") {
                        url += "win-";
                        exten = ".exe";
                    } else if (os === "darwin") {
                        url += "macos-";
                    } else if (os === "linux") {
                        url += "linux-";
                    } else {
                        vscode.window.showErrorMessage("Your operating system is not supported."+os);
                        return;
                    }

                    if (arch === "x64") {
                        url += "x64";
                    } else if (arch === "arm64") {
                        url += "arm64";
                    } else if (arch === "arm") {
                        url += "arm";
                    } else {
                        vscode.window.showErrorMessage("Your CPU architecture is not supported."+arch);
                        return;
                    }
                    url += exten;

                    // deactivate the language client
                    deactivateLanguageClient();

                    // download the file
                    vscode.window.showInformationMessage("Downloading RISC-V Emulator...");
                    const downloadSettings = {"makeExecutable":true};
                    api.downloadFile(vscode.Uri.parse(url), "riscvemulator.exe", context, undefined, undefined, downloadSettings).then((fileUri: vscode.Uri) => {
                        context.globalState.update("riscvemulator", fileUri.fsPath);
                        context.globalState.update("riscvemulatorVersion", version);
                        context.globalState.update("osarch", os+arch);
                        vscode.window.showInformationMessage("RISC-V Emulator downloaded. Have fun!");

                        // reload the extension
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    });
                }
            });
        });

        let emulatorInstalled = context.globalState.get("riscvemulator") !== undefined;
        let osarchChanged = context.globalState.get("osarch") !== process.platform+process.arch;
        if (!emulatorInstalled || osarchChanged) {
            // download it - first must get the system type (OS and architecture)
            // then download the correct file
            let os = process.platform;
            let arch = process.arch;
            let exten = '';

            let url = baseUrl + "riscvemulator-";
            if (os === "win32") {
                url += "win-";
                exten = ".exe";
            } else if (os === "darwin") {
                url += "macos-";
            } else if (os === "linux") {
                url += "linux-";
            } else {
                vscode.window.showErrorMessage("Your operating system is not supported."+os);
                return;
            }

            if (arch === "x64") {
                url += "x64";
            } else if (arch === "arm64") {
                url += "arm64";
            } else if (arch === "arm") {
                url += "arm";
            } else {
                vscode.window.showErrorMessage("Your CPU architecture is not supported."+arch);
                return;
            }
            url += exten;

            // download the file
            vscode.window.showInformationMessage("Downloading RISC-V Emulator...");
            const downloadSettings = {"makeExecutable":true};
            api.downloadFile(vscode.Uri.parse(url), "riscvemulator.exe", context, undefined, undefined, downloadSettings).then((fileUri: vscode.Uri) => {
                context.globalState.update("riscvemulator", fileUri.fsPath);
                context.globalState.update("osarch", os+arch);
                vscode.window.showInformationMessage("RISC-V Emulator downloaded. Have fun!");

                // reload the extension
                vscode.commands.executeCommand("workbench.action.reloadWindow");
            });
        }
    });
}