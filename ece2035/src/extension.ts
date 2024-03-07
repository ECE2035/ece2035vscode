// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { DebugDescriptorFactory } from './debugger/debuggerDescriptionFactory';
import { DebugConfigurationProvider } from './debugger/debuggerProvider';

import { activateLanguageClient, deactivateLanguageClient } from './languageClient/languageClient';

import {getScreenViewHTML} from './screenView/screenView';
import { checkDependencies } from './depDownloader';

const disposables: vscode.Disposable[] = [];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ece2035" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ece2035.openscreen', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('This will be opening the screen (coming soon)');
		const panel = vscode.window.createWebviewPanel(
			'screenView',
			'RISC-V Screen View',
			vscode.ViewColumn.Two,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getScreenViewHTML();
		screenOpened = true;
		panel.onDidDispose(() => {
			screenOpened = false;
		});
	});

	const configProvider = new DebugConfigurationProvider();
    const descriptionFactory = new DebugDescriptorFactory(context);
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
	console.log("activated");

	checkDependencies(context);

	context.subscriptions.push(disposable);
	activateLanguageClient(context);

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
		if (!screenOpened) {
			const panel = vscode.window.createWebviewPanel(
				'screenView',
				'RISC-V Screen View',
				vscode.ViewColumn.Two,
				{
					enableScripts: true
				}
			);

			panel.webview.html = getScreenViewHTML();
			screenOpened = true;
			panel.onDidDispose(() => {
				screenOpened = false;
			});
		}
	}
}