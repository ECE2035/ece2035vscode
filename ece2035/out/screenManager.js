"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenManager = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fs = require("fs");
class ScreenManager {
    constructor(context) {
        this.screenOpened = false;
        this.commandHandlers = new Map();
        this.context = context;
        this.mode = "idle";
    }
    openScreenPanel() {
        if (this.screenOpened) {
            return;
        }
        this.screenPanel = vscode.window.createWebviewPanel('screenView', 'RISC-V Screen View', {
            preserveFocus: true,
            viewColumn: vscode.ViewColumn.Two,
        }, {
            enableScripts: true,
        });
        const filtPath = vscode.Uri.file(this.context.asAbsolutePath("assets/html/screenView.html"));
        this.setWebviewContent();
        this.screenOpened = true;
        this.screenPanel.onDidDispose(() => {
            this.screenOpened = false;
        });
        this.screenPanel.webview.onDidReceiveMessage((message) => {
            let handler = this.commandHandlers.get(message.command);
            if (handler) {
                handler(message.data);
            }
        });
        vscode.window.onDidChangeActiveColorTheme(e => {
            this.setWebviewContent();
        });
    }
    closeScreenPanel() {
        if (this.screenPanel) {
            this.screenPanel.dispose();
            this.screenOpened = false;
        }
    }
    sendScreenMessage(command, data) {
        this.mode = "active";
        if (this.screenPanel) {
            this.screenPanel.webview.postMessage({ command: command, data: data });
        }
    }
    registerCommandHandler(command, handler) {
        this.commandHandlers.set(command, handler);
    }
    removeCommandHandler(command) {
        this.commandHandlers.delete(command);
    }
    showTestCase(testCase) {
        this.openScreenPanel();
        if (this.screenPanel) {
            let workspaceFolders = vscode.workspace.workspaceFolders;
            let data = {
                image: this.screenPanel.webview.asWebviewUri(vscode.Uri.file(testCase.getImagePath())).toString(),
                stats: testCase.stats,
                status: testCase.status,
            };
            this.screenPanel.webview.postMessage({ command: "show_past_screen", data: data });
            this.mode = "past";
        }
    }
    getMode() {
        if (!this.screenOpened) {
            return "closed";
        }
        return this.mode;
    }
    setWebviewContent() {
        if (!this.screenPanel) {
            return;
        }
        const filtPath = vscode.Uri.file(this.context.asAbsolutePath("assets/html/screenView.html"));
        let contents = fs.readFileSync(filtPath.fsPath, "utf8");
        ;
        const buttonBackgroundColor = new vscode.ThemeColor("button.background");
        const buttonTextColor = new vscode.ThemeColor("button.foreground");
        const buttonBorderColor = new vscode.ThemeColor("button.border");
        const buttonHoverBackgroundColor = new vscode.ThemeColor("button.hoverBackground");
        this.screenPanel.webview.html = contents;
    }
}
exports.ScreenManager = ScreenManager;
//# sourceMappingURL=screenManager.js.map