/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { TestCase } from './testcases/testCase';
import path = require('path');

export class ScreenManager {
    private screenOpened = false;
    private screenInitialized = false;
    private context: vscode.ExtensionContext;
    private screenPanel: vscode.WebviewPanel | undefined;
    private commandHandlers: Map<string, (data: any) => void> = new Map();
    private commandQueue: any[] = [];

    private mode: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.mode = "idle";
    }

    public openScreenPanel() {
        if (this.screenOpened) {
            return;
        }

        this.screenPanel = vscode.window.createWebviewPanel(
            'memoryView',
            'RISC-V Memory View',
            {
                preserveFocus: true,
                viewColumn: vscode.ViewColumn.Two,
            },
            {
                enableScripts: true,
            }
        );

        this.screenPanel.webview.onDidReceiveMessage((message) => {

            // There's a chance we send data before the webview can be properly loaded
            // on slower machines. Instead, we have a "ready" signal the webview will
            // send to signal data can now be sent
            if (message.command === "ready") {
                console.log("Received ready command");

                this.screenInitialized = true;

                // Run through all received commands before it was ready and send them
                while (this.commandQueue.length !== 0) {
                    let command = this.commandQueue.shift();

                    console.log(`Running ${command} from queue`);
                    this.screenPanel?.webview.postMessage(command);
                }
            } else {
                let handler = this.commandHandlers.get(message.command);
                if (handler) {
                    handler(message.data);
                }
            }

        });


        this.setWebviewContent();
        this.screenOpened = true;
        this.screenPanel.onDidDispose(() => {
            this.screenOpened = false;
            this.screenInitialized = false;
        });


        vscode.window.onDidChangeActiveColorTheme(e => {
            this.setWebviewContent();
        });
    }

    public getScreenPanel() {
        return this.screenPanel;
    }

    public closeScreenPanel() {
        if (this.screenPanel) {
            this.screenPanel.dispose();
            this.screenOpened = false;
        }
    }

    public sendScreenMessage(command: string, data: any) {
        this.mode = "active";
        if (this.screenPanel) {
            this.postCommand({ command: command, data: data });
        }
    }

    public registerCommandHandler(command: string, handler: (data: any) => void) {
        this.commandHandlers.set(command, handler);
    }

    public removeCommandHandler(command: string) {
        this.commandHandlers.delete(command);
    }

    public async postCommand(args: any) {
        // If the webview hasn't been initialized yet,
        // enqueue onto the command buffer .As soon as the 
        // ready signal is sent, these are sent in bulk

        if (!this.screenInitialized) {
            this.commandQueue.push(args);
        } else {

            this.screenPanel?.webview.postMessage(args);
        }
    }

    public showTestCase(testCase: TestCase) {
        this.openScreenPanel();

        if (this.screenPanel) {
            let workspaceFolders = vscode.workspace.workspaceFolders;

            let data = {
                image: this.screenPanel.webview.asWebviewUri(vscode.Uri.file(testCase.getImagePath()!)).toString(),
                stats: testCase.stats,
                status: testCase.status,
            };

            this.postCommand({ command: "show_past_screen", data: data });
            this.mode = "past";
        }
    }

    public setMode(mode: string) {
        this.mode = mode;
    }

    public getMode() {
        if (!this.screenOpened) {
            return "closed";
        }

        return this.mode;
    }

    private setWebviewContent() {
        if (!this.screenPanel) {
            return;
        }

        // const filtPath: vscode.Uri = vscode.Uri.file(this.context.asAbsolutePath("assets/html/memoryView.html"));
        // let contents = fs.readFileSync(filtPath.fsPath, "utf8");;

        const buttonBackgroundColor = new vscode.ThemeColor("button.background");
        const buttonTextColor = new vscode.ThemeColor("button.foreground");
        const buttonBorderColor = new vscode.ThemeColor("button.border");
        const buttonHoverBackgroundColor = new vscode.ThemeColor("button.hoverBackground");

        let scriptSrc = this.screenPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "web", "dist", "index.js"))
        let cssSrc = this.screenPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "web", "dist", "index.css"));

        this.screenPanel.webview.html = `<!DOCTYPE html>
        
        <html lang="en">
          <head>
            <link rel="stylesheet" href="${cssSrc}" />
          </head>
          <body>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <div id="root"></div>
            <script src="${scriptSrc}"></script>
          </body>
        </html>
        `;

        // this.screenPanel.webview.html = contents;
    }
}