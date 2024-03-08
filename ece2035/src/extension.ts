// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { DebugDescriptorFactory } from './debugger/debuggerDescriptionFactory';
import { DebugConfigurationProvider } from './debugger/debuggerProvider';

import { activateLanguageClient, deactivateLanguageClient } from './languageClient/languageClient';

import {getScreenViewHTML} from './screenView/screenView';
import { checkDependencies } from './depDownloader';

const disposables: vscode.Disposable[] = [];
var globalContext: vscode.ExtensionContext;

const useLocalEmulator = false; // !! IMPORTANT !! Set this to FALSE before deploying the extension.
const localEmulatorPath = "C:\\Users\\dcoop\\github\\riscvemulator\\RISC-V-Emulator\\riscvemulator.exe";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	globalContext = context;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ece2035" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ece2035.openscreen', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		openScreenPanel(context);
	});

	const configProvider = new DebugConfigurationProvider();
    const descriptionFactory = new DebugDescriptorFactory(context, useLocalEmulator, localEmulatorPath);
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
	console.log("activated");

	checkDependencies(context);

	context.subscriptions.push(disposable);
	activateLanguageClient(context, useLocalEmulator, localEmulatorPath);

	vscode.debug.onDidStartDebugSession(debugStartedEvent);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("deactived");
	disposables.forEach(d => d.dispose());
	deactivateLanguageClient();
}

var screenOpened = false;
function debugStartedEvent(event: vscode.DebugSession) {
	if (event.type === "riscv-vm") {
		openScreenPanel(globalContext);
	}
}

function openScreenPanel(context: vscode.ExtensionContext) {
	if (screenOpened) {
		return;
	}

	const panel = vscode.window.createWebviewPanel(
		'screenView',
		'RISC-V Screen View',
		{
			preserveFocus: true,
			viewColumn: vscode.ViewColumn.Two,
		},
		{
			enableScripts: true,
		}
	);

	const filtPath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, "src", "html", "screenView.html"));

	panel.webview.html = fs.readFileSync(filtPath.fsPath, "utf8");
	screenOpened = true;
	panel.onDidDispose(() => {
		screenOpened = false;
	});
}