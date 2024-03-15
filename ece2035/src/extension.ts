// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { DebugDescriptorFactory } from './debugger/debuggerDescriptionFactory';
import { DebugConfigurationProvider } from './debugger/debuggerProvider';

import { activateLanguageClient, deactivateLanguageClient } from './languageClient/languageClient';

import { checkDependencies } from './depDownloader';
import { setUpDevEnvironment } from './devEnvironment';

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
	let openCommand = vscode.commands.registerCommand('ece2035.openscreen', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		openScreenPanel(context);
	});
	let newAssignmentCommand = vscode.commands.registerCommand('ece2035.newAssignment', setupDevEnvironmentCommand);

	const configProvider = new DebugConfigurationProvider();
    const descriptionFactory = new DebugDescriptorFactory(context, useLocalEmulator, localEmulatorPath);
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
	console.log("activated");

	checkDependencies(context);

	context.subscriptions.push(openCommand, newAssignmentCommand);
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

	const filtPath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, "assets", "html", "screenView.html"));

	panel.webview.html = fs.readFileSync(filtPath.fsPath, "utf8");
	screenOpened = true;
	panel.onDidDispose(() => {
		screenOpened = false;
	});
}

function setupDevEnvironmentCommand() {
	// prompt user for directory
	const options: vscode.OpenDialogOptions = {
		canSelectMany: false, // Allow selection of only one folder
		openLabel: 'Select a directory to create the project in',
		canSelectFiles: false, // Do not allow file selection
		canSelectFolders: true, // Allow folder selection
	};

	vscode.window.showOpenDialog(options).then(fileUri => {
		if (fileUri && fileUri[0]) {
			setUpDevEnvironment(globalContext, fileUri[0].fsPath);

			// open the new project in a new window
			vscode.commands.executeCommand('vscode.openFolder', fileUri[0], false);
		}
	});
}