"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const debuggerDescriptionFactory_1 = require("./debugger/debuggerDescriptionFactory");
const debuggerProvider_1 = require("./debugger/debuggerProvider");
const languageClient_1 = require("./languageClient/languageClient");
const depDownloader_1 = require("./depDownloader");
const devEnvironment_1 = require("./devEnvironment");
const testCaseExplorer_1 = require("./testcases/testCaseExplorer");
const screenManager_1 = require("./screenManager");
const disposables = [];
var globalContext;
var screenManager;
var testCasesManager;
var currentSeed = 0;
var showingTestCase;
const useLocalEmulator = false; // !! IMPORTANT !! Set this to FALSE before deploying the extension.
const localEmulatorPath = "C:\\Users\\Linda Wills\\Documents\\GitHub\\RISC-V-Emulator\\riscvemulator.exe";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    globalContext = context;
    screenManager = new screenManager_1.ScreenManager(context);
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
    testCasesManager = new testCaseExplorer_1.TestCasesManager(context, useLocalEmulator, localEmulatorPath);
    testCasesManager.updatedResultCallback = newTestResult;
    let newAssignmentCommand = vscode.commands.registerCommand('ece2035.newAssignment', setupDevEnvironmentCommand);
    let runTestCaseCommand = vscode.commands.registerCommand('ece2035.runTestCase', runTestCase);
    let debugTestCaseCommand = vscode.commands.registerCommand('ece2035.debugTestCase', debugTestCase);
    let deleteTestCaseCommand = vscode.commands.registerCommand('ece2035.deleteTestCase', deleteTestCase);
    let viewTestCaseCommand = vscode.commands.registerCommand('ece2035.viewTestCase', viewTestCase);
    let runAllTestCasesCommand = vscode.commands.registerCommand('ece2035.runAllTestCases', runAllTestCases);
    const configProvider = new debuggerProvider_1.DebugConfigurationProvider();
    const descriptionFactory = new debuggerDescriptionFactory_1.DebugDescriptorFactory(context, useLocalEmulator, localEmulatorPath);
    disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
    disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
    console.log("activated");
    (0, depDownloader_1.checkDependencies)(context);
    context.subscriptions.push(openCommand, newAssignmentCommand);
    context.subscriptions.push(runTestCaseCommand, debugTestCaseCommand, deleteTestCaseCommand, viewTestCaseCommand);
    (0, languageClient_1.activateLanguageClient)(context, useLocalEmulator, localEmulatorPath);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('riscvtestcases', testCasesManager));
    vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
        console.log("Received event: " + event.event);
        if (event.event === "riscv_screen") {
            screenManager.sendScreenMessage("screen_update", event.body);
            if (event.body.status === "passed") {
                testCasesManager.reportUpdatedStatus(currentSeed.toString(), "pass", {
                    di: event.body.stats.di,
                    si: event.body.stats.si,
                    reg: event.body.stats.reg,
                    mem: event.body.stats.mem
                });
            }
            else if (event.body.status === "failed") {
                testCasesManager.reportUpdatedStatus(currentSeed.toString(), "fail", {
                    di: event.body.stats.di,
                    si: event.body.stats.si,
                    reg: event.body.stats.reg,
                    mem: event.body.stats.mem
                });
            }
        }
        else if (event.event === "riscv_context") {
            currentSeed = event.body.seed;
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
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {
    console.log("deactived");
    disposables.forEach(d => d.dispose());
    (0, languageClient_1.deactivateLanguageClient)();
}
exports.deactivate = deactivate;
var screenOpened = false;
function debugStartedEvent(event) {
    if (event.type === "riscv-vm") {
        screenManager.openScreenPanel();
    }
}
function setupDevEnvironmentCommand() {
    // prompt user for directory
    const options = {
        canSelectMany: false,
        openLabel: 'Select a directory to create the project in',
        canSelectFiles: false,
        canSelectFolders: true, // Allow folder selection
    };
    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
            (0, devEnvironment_1.setUpDevEnvironment)(globalContext, fileUri[0].fsPath);
            // open the new project in a new window
            vscode.commands.executeCommand('vscode.openFolder', fileUri[0], false);
        }
    });
}
function runTestCase(item) {
    console.log("Running test case: " + item.description);
    testCasesManager.runTestCaseHandler(item);
}
function debugTestCase(item) {
    console.log("Debugging test case: " + item.description);
    testCasesManager.debugTestCaseHandler(item);
}
function runAllTestCases() {
    testCasesManager.handleRunAllTestCases();
}
function deleteTestCase(item) {
    console.log("Deleting test case: " + item.description);
    testCasesManager.deleteTestCase(item);
}
function viewTestCase(item) {
    showingTestCase = item;
    screenManager.showTestCase(item);
}
function newTestResult(item) {
    if (!showingTestCase) {
        return;
    }
    if (item.description === showingTestCase.description && screenManager.getMode() === "past") {
        viewTestCase(item);
    }
}
//# sourceMappingURL=extension.js.map