import * as vscode from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let languageClient: LanguageClient;

export function activateLanguageClient(context: vscode.ExtensionContext) {
    const serverOptions: ServerOptions = {
		command: "C:\\Users\\dcoop\\github\\RISC-V-Emulator\\riscvemulator.exe",
        args: ["languageServer"] // "debug"
	};

    const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'riscv' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

    languageClient = new LanguageClient(
        'RISCVLanguageServer',
        'RISC-V Language Server',
        serverOptions,
        clientOptions
    );

    languageClient.start();
}

export function deactivateLanguageClient(): Thenable<void> | undefined {
    if (!languageClient) {
        return undefined;
    }
    return languageClient.stop();
}