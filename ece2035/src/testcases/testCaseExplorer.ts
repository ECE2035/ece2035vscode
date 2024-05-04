import * as vscode from 'vscode';
import { TestCase } from './testCase';
import * as path from 'path';

export class TestCasesManager implements vscode.TreeDataProvider<TestCase> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestCase | undefined> = new vscode.EventEmitter<TestCase | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TestCase | undefined> = this._onDidChangeTreeData.event;

    private testCases: TestCase[] = [];

    constructor() {
        // loading test cases from the disk
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        let testCasesFolder = path.join(workspaceRoot, ".vscode", "testcases");

        let fs = require('fs');
        if (!fs.existsSync(testCasesFolder)) {
            return;
        }

        let files = fs.readdirSync(testCasesFolder);
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.endsWith(".png")) {
                let parts = file.split("_");
                let title = parts[0];
                let seed = parts[1].split(".")[0];
                this.testCases.push(new TestCase(title, seed, "unknown"));
            }
        }
    }

    getTreeItem(element: TestCase): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestCase): TestCase[] {
        if (element) {
            return [];
        } else if (this.testCases.length === 0) {
            return [new TestCase("No test cases found", "", ""), new TestCase("", "Add a new test case while or after debugging your assembly.", "")];
        } else {
            return this.testCases;
        }
    }

    public addNewTestCase(title: string, seed: string, status: string, b64Img: string) {
        // adding the new test case to the disk under the folder {workspaceRoot}/.vscode/testcases
        // checking if the folder exists
        // if not, create the folder
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to add test cases.");
            return;
        }
        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        let testCasesFolder = path.join(workspaceRoot, ".vscode", "testcases");

        let fs = require('fs');
        if (!fs.existsSync(testCasesFolder)) {
            fs.mkdirSync(testCasesFolder);
        }

        let testCasePath = path.join(testCasesFolder, title + "_" + seed + ".png");
        let buffer = Buffer.from(b64Img, 'base64');
        fs.writeFileSync(testCasePath, buffer);

        this.testCases.push(new TestCase(title, seed, status));
        this._onDidChangeTreeData.fire(undefined); // the root node has changed
    }

    public viewTestCaseHandler(item: any) {
        // item should be a TestCase
        let title = item.label;
        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to view test cases.");
            return;
        }

        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        let testCasesFolder = path.join(workspaceRoot, ".vscode", "testcases");
        let testCasePath = path.join(testCasesFolder, title + "_" + seed + ".png");

        // opening the image in the second view column
        let uri = vscode.Uri.file(testCasePath);
        vscode.commands.executeCommand('vscode.open', uri); // TEMPORARY
    }

    public runTestCaseHandler(item: any) {
        // item should be a TestCase
        let title = item.label;
        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return;
        }

        // accessing launch.json parameters
        let launchConfig = vscode.workspace.getConfiguration("launch");
        let assemblyCode: string | undefined = launchConfig.get("program");
        let assignmentCode: string | undefined = launchConfig.get("assignment");

        // converting both to absolute paths
        if (!assemblyCode || !assignmentCode) {
            vscode.window.showErrorMessage("Please set the program and assignment in launch.json to run test cases.");
            return;
        }
        let assemblyPath = path.join(workspaceFolders[0].uri.fsPath, assemblyCode);
    }
}