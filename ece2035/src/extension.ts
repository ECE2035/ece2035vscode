// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { DebugDescriptorFactory } from './debugger/debuggerDescriptionFactory';
import { DebugConfigurationProvider } from './debugger/debuggerProvider';

import { activateLanguageClient, deactivateLanguageClient } from './languageClient/languageClient';

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
	let disposable = vscode.commands.registerCommand('ece2035.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ECE2035!');
	});

	const configProvider = new DebugConfigurationProvider();
    const descriptionFactory = new DebugDescriptorFactory();
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("mipsvm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("mipsvm", configProvider))
	console.log("activated");

	context.subscriptions.push(disposable);
	activateLanguageClient(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("deactived");
	disposables.forEach(d => d.dispose());
	deactivateLanguageClient();
}
