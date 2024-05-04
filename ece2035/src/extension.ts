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

import { TestCasesManager } from './testcases/testCaseExplorer';
import { ScreenManager } from './screenManager';

const disposables: vscode.Disposable[] = [];
var globalContext: vscode.ExtensionContext;
var screenManager: ScreenManager;

const useLocalEmulator = false; // !! IMPORTANT !! Set this to FALSE before deploying the extension.
const localEmulatorPath = "C:\\Users\\dcoop\\github\\RISC-V-Emulator-New\\riscvemulator.exe";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	globalContext = context;
	screenManager = new ScreenManager(context);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ece2035" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let openCommand = vscode.commands.registerCommand('ece2035.openscreen', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		screenManager.openScreenPanel();
	});

	const testCasesManager = new TestCasesManager();

	let newAssignmentCommand = vscode.commands.registerCommand('ece2035.newAssignment', setupDevEnvironmentCommand);
	let runTestCaseCommand = vscode.commands.registerCommand('ece2035.runTestCase', runTestCase);
	let debugTestCaseCommand = vscode.commands.registerCommand('ece2035.debugTestCase', debugTestCase);
	let deleteTestCaseCommand = vscode.commands.registerCommand('ece2035.deleteTestCase', deleteTestCase);
	let viewTestCaseCommand = vscode.commands.registerCommand('ece2035.viewTestCase', testCasesManager.viewTestCaseHandler);

	const configProvider = new DebugConfigurationProvider();
    const descriptionFactory = new DebugDescriptorFactory(context, useLocalEmulator, localEmulatorPath);
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
	console.log("activated");

	checkDependencies(context);

	context.subscriptions.push(openCommand, newAssignmentCommand);
	context.subscriptions.push(runTestCaseCommand, debugTestCaseCommand, deleteTestCaseCommand, viewTestCaseCommand);
	activateLanguageClient(context, useLocalEmulator, localEmulatorPath);

	context.subscriptions.push(vscode.window.registerTreeDataProvider('riscvtestcases', testCasesManager));

	vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
		console.log("Received event: " + event.event);
		if (event.event === "riscv_screen") {
			screenManager.sendScreenMessage("screen_update", event.body);
		} else if (event.event === "riscv_context") {
			screenManager.sendScreenMessage("context_update", event.body);
		}
	});

	vscode.debug.onDidStartDebugSession(debugStartedEvent);

	screenManager.registerCommandHandler("save_testcase", (data) => {
		// popup for the title
		let title = vscode.window.showInputBox({ prompt: "Enter a title for the test case" }).then((title) => {
			if (!title) {
				title = "Untitled Testcase";
			}
			testCasesManager.addNewTestCase(title, data.seed.toString(), "unknown", data.image);
		});
	});
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
		screenManager.openScreenPanel();
	}
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

function runTestCase(item: any) {
	// TODO: Implement this function
	console.log("Running test case: " + item.description);
}

function debugTestCase() {
	// TODO: Implement this function
}

function deleteTestCase() {
	// TODO: Implement this function
}