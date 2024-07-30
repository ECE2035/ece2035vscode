"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateLanguageClient = exports.activateLanguageClient = void 0;
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
let languageClient;
function activateLanguageClient(context, useLocalEmulator, localEmulatorPath) {
    let command;
    if (!useLocalEmulator) {
        command = context.globalState.get("riscvemulator");
    }
    else {
        command = localEmulatorPath;
    }
    const serverOptions = {
        command: command,
        args: ["languageServer"] // "debug"
    };
    const clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'riscv' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    languageClient = new node_1.LanguageClient('RISCVLanguageServer', 'RISC-V Language Server', serverOptions, clientOptions);
    languageClient.start();
}
exports.activateLanguageClient = activateLanguageClient;
function deactivateLanguageClient() {
    if (!languageClient) {
        return undefined;
    }
    return languageClient.stop();
}
exports.deactivateLanguageClient = deactivateLanguageClient;
//# sourceMappingURL=languageClient.js.map