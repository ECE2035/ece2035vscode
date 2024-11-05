/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { TestCase } from './testcases/testCase';
import path = require('path');

export class ScreenManager {
    private screenOpened = false;
    private context :vscode.ExtensionContext;
    private screenPanel: vscode.WebviewPanel | undefined;
    private commandHandlers: Map<string, (data: any) => void> = new Map();

    private mode: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.mode = "idle";

        context.subscriptions.push(
            vscode.debug.registerDebugAdapterTrackerFactory('*', {
                createDebugAdapterTracker: (session: vscode.DebugSession) => ({
                    onWillReceiveMessage: async (message: any) => {
                        if (message.command === 'next' || message.command === 'stepIn' || message.command === 'stepOut' || message.command === 'continue') {
                            console.log("found that event");
                            await this.readMemory();
                        }
                    }
                })
            })
        );
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
            console.log("Received ", message);

            let handler = this.commandHandlers.get(message.command);
            if (handler) {
                handler(message.data);
            }
        });


        this.setWebviewContent();
        this.screenOpened = true;
        this.screenPanel.onDidDispose(() => {
            this.screenOpened = false;
        });


        vscode.window.onDidChangeActiveColorTheme(e => {
            this.setWebviewContent();
        });

        // initial memory request
        this.readMemory();
    }

    public async readMemory() {

        vscode.window.showInformationMessage("attempting to poll");
        try {
            const session = vscode.debug.activeDebugSession;

            if (!session) {
                vscode.window.showErrorMessage("Attempted to read memory when debugger wasn't running.");
                return;
            }


            // retrieve the stack pointer register for knowing stack size
            const stackValue = await session.customRequest('variables', {
                variablesReference: 2
            });

            const spAddressString = stackValue.variables[1].value;
            let spAddress = parseInt(spAddressString, 16);
            let spStartMagicNumber = 0x7FFFFFF0;

            const response = await session.customRequest('readMemory', {
                memoryReference: '',
                offset: spAddress, // hex of current sp
                count: (spStartMagicNumber - spAddress) >> 2// retrieve all stack contents
            });

            // retrieve the gp register for color highlighting
            const registerValues = await session.customRequest('variables', {
                variablesReference: 3
            });



            await this.screenPanel?.webview.postMessage({ command: "read_memory", data: { base64: response.data, gp: registerValues.variables[0] }});

        } catch(err) {
            
            
            vscode.window.showErrorMessage(`Failed to read memory from debugger: ${err}`);
            
        }

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
            this.screenPanel.webview.postMessage({ command: command, data: data });
        }
    }

    public registerCommandHandler(command: string, handler: (data: any) => void) {
        this.commandHandlers.set(command, handler);
    }

    public removeCommandHandler(command: string) {
        this.commandHandlers.delete(command);
    }

    public showTestCase(testCase: TestCase) {
        this.openScreenPanel();
        if (this.screenPanel) {
            let workspaceFolders = vscode.workspace.workspaceFolders;

            let data = {
                image: this.screenPanel.webview.asWebviewUri(vscode.Uri.file(testCase.getImagePath()!)).toString(),
                stats: testCase.stats,
                status: testCase.status,
            }
            this.screenPanel.webview.postMessage({ command: "show_past_screen", data: data });
            this.mode = "past";
        }
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

        const filtPath: vscode.Uri = vscode.Uri.file(this.context.asAbsolutePath("assets/html/memoryView.html"));
        let contents = fs.readFileSync(filtPath.fsPath, "utf8");;

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