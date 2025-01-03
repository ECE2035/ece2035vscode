import * as vscode from 'vscode';
import { TestCase } from './testCase';
import * as path from 'path';
import { TestCaseExecutor, TestCaseExecutionResult } from './testCaseExecution';
import { getResolvedLaunchConfig } from '../utils';
import { ScreenManager } from '../screenManager';
import { fail } from 'assert';
var screenManager: ScreenManager;
var globalContext: vscode.ExtensionContext;


const outputChannel = vscode.window.createOutputChannel("Test Suite Results");

type passIn = {
    di: number,
    si: number,
    reg: number,
    mem: number
};


export class TestCasesManager implements vscode.TreeDataProvider<TestCase> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<TestCase | undefined> = new vscode.EventEmitter<TestCase | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TestCase | undefined> = this._onDidChangeTreeData.event;

    private testCases: TestCase[] = [];
    private context: vscode.ExtensionContext;
    private useLocalEmulator: boolean;
    private localEmulatorPath: string;
    

    public updatedResultCallback: any;

    constructor(context: vscode.ExtensionContext, useLocalEmulator: boolean, localEmulatorPath: string) {
        this.context = context;
        this.useLocalEmulator = useLocalEmulator;
        this.localEmulatorPath = localEmulatorPath;

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
                // destructively pop off the last string and split by '.' to separate the seed from '.png' 
                let seed = parts.pop().split(".")[0];
                // reconstruct the original title of the test case
                let title = ((parts.length > 1) ? parts.join("_") : parts[0]);
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

    public async runTestCaseHandler(item: any) {
        // item should be a TestCase
        item.updateIcon("running");
        this._onDidChangeTreeData.fire(item);

        let title = item.label;
        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return;
        }

        // accessing launch.json parameters
        let launchConfig = getResolvedLaunchConfig()[0];
        let assemblyCode: string | undefined = launchConfig["program"];
        let assignmentCode: string | undefined = launchConfig["assignment"];

        // converting both to absolute paths
        if (!assemblyCode || !assignmentCode) {
            vscode.window.showErrorMessage("Please set the program and assignment in launch.json to run test cases.");
            return;
        }

        let binPath: string;
        if (!this.useLocalEmulator) {
            binPath = this.context.globalState.get("riscvemulator") as string;
        } else {
            binPath = this.localEmulatorPath;
        }
        const executor = new TestCaseExecutor(binPath, (result: TestCaseExecutionResult) => {
            // updating the status of the test case
            for (let i = 0; i < this.testCases.length; i++) {
                let testCase = this.testCases[i];
                if (testCase.description === seed) {
                    testCase.updateIcon(result.status);
                    testCase.stats = {
                        di: result.di,
                        si: result.si,
                        reg: result.regUsed,
                        mem: result.memUsed,
                        numErrors: result.numErrors
                    };
                    this._onDidChangeTreeData.fire(testCase);

                    if (this.updatedResultCallback) {
                        this.updatedResultCallback(testCase);
                    }
                }
            }
        });
        executor.execute(assignmentCode, assemblyCode, [seed]);
    }

    public async handleRunAllTestCases(context: vscode.ExtensionContext) {
        screenManager = new ScreenManager(context);
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return;
        }

        // accessing launch.json parameters
        let launchConfig = getResolvedLaunchConfig()[0];
        let assemblyCode: string | undefined = launchConfig["program"];
        let assignmentCode: string | undefined = launchConfig["assignment"];

        // converting both to absolute paths
        if (!assemblyCode || !assignmentCode) {
            vscode.window.showErrorMessage("Please set the program and assignment in launch.json to run test cases.");
            return;
        }

        let binPath: string;
        if (!this.useLocalEmulator) {
            binPath = this.context.globalState.get("riscvemulator") as string;
        } else {
            binPath = this.localEmulatorPath;
        }

        let averageDi = 0;
        let averageSi = 0;
        let averageReg = 0;
        let averageMem = 0;

        let averagePassDi = 0;
        let averagePassSi = 0;
        let averagePassReg = 0;
        let averagePassMem = 0;

        let completedTestCases = 0;
        let passedTestCases = 0;

        //const debugConsole = vscode.debug.activeDebugConsole;

        const executor = new TestCaseExecutor(binPath, (result: TestCaseExecutionResult) => {
            // updating the status of the test case
            for (let i = 0; i < this.testCases.length; i++) {
                let testCase = this.testCases[i];
                if (testCase.description === result.seed.toString()) {
                    testCase.updateIcon(result.status);
                    testCase.stats = {
                        di: result.di,
                        si: result.si,
                        reg: result.regUsed,
                        mem: result.memUsed,
                        numErrors: result.numErrors
                    };
                    averageDi += result.di;
                    averageSi += result.si;
                    averageReg += result.regUsed;
                    averageMem += result.memUsed;

                    if(result.status === "pass"){
                        averagePassDi += result.di;
                        averagePassSi += result.si;
                        averagePassReg += result.regUsed;
                        averagePassMem += result.memUsed;
                        passedTestCases++;
                    }

                    this._onDidChangeTreeData.fire(testCase);

                    if (this.updatedResultCallback) {
                        this.updatedResultCallback(testCase);
                    }
                    // Increment completed test cases
                    completedTestCases++;

                    // Check if all test cases are completed
                    if (completedTestCases === this.testCases.length) {
                        // Calculate averages
                        averageDi /= this.testCases.length;
                        averageSi /= this.testCases.length;
                        averageReg /= this.testCases.length;
                        averageMem /= this.testCases.length;

                        averagePassDi /= passedTestCases;
                        averagePassSi /= passedTestCases;
                        averagePassReg /= passedTestCases;
                        averagePassMem /= passedTestCases;

                        averageDi = parseFloat(averageDi.toFixed(2));
                        averageSi = parseFloat(averageSi.toFixed(2));
                        averageReg = parseFloat(averageReg.toFixed(2));
                        averageMem = parseFloat(averageMem.toFixed(2));

                        averagePassDi = parseFloat(averagePassDi.toFixed(2));
                        averagePassSi = parseFloat(averagePassSi.toFixed(2));
                        averagePassReg = parseFloat(averagePassReg.toFixed(2));
                        averagePassMem = parseFloat(averagePassMem.toFixed(2));

                        outputChannel.show(true);  // Make sure the Output Channel is visible
                        //put them all on the same line
                        outputChannel.appendLine("The metric results of your test cases are: ");
                        outputChannel.appendLine(`Average DI: ${averageDi}, SI: ${averageSi}, Reg: ${averageReg}, Mem: ${averageMem}`);
                        if(passedTestCases === 0){
                            outputChannel.appendLine('All test cases failed, go through your program to ensure you have no errors ' + 
                            'and that you have read the assignment write up carefully to ensure you are reporting your answers correctly.');
                        }
                        else{
                            outputChannel.appendLine(`Average Passed Test Cases DI: ${averagePassDi}, SI: ${averagePassSi}, Reg: ${averagePassReg}, Mem: ${averagePassMem}`);
                        }
                        // Optionally show information to the user if not in debug mode
                        vscode.window.showInformationMessage(
                            `Test Case Averages: DI=${averageDi}, SI=${averageSi}, Reg=${averageReg}, Mem=${averageMem}`
                        );
                        let pass: passIn = {
                            di: averageDi,
                            si: averageSi,
                            reg: averageReg,
                            mem: averageMem
                        };
                        screenManager.openScreenPanel();
                        if (screenManager.getScreenPanel()) {
                            let workspaceFolders = vscode.workspace.workspaceFolders;
                        

                            let data = {
                                status: "done", 
                                stats: pass,
                            };
                            const screenPanel = screenManager.getScreenPanel();
                            if (screenPanel) {
                                console.log("attempting to post");
                                screenPanel.webview.postMessage({ command: "show_multi_screen", data: data });
                                console.log("after");
                            }

                            console.log(data);
                            screenManager.setMode("multi");
                            //return output;
                        }
                    }
                }
            }
        });

        let seeds: string[] = [];
        for (let i = 0; i < this.testCases.length; i++) {
            seeds.push(this.testCases[i].description);

            // updating the status of the test case
            this.testCases[i].updateIcon("running");
        }
        executor.execute(assignmentCode, assemblyCode, seeds);
        
    }

    public async handleMultiExecute(amount: number, context: vscode.ExtensionContext){
        //globalContext = context;
	    screenManager = new ScreenManager(context);
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return;
        }
        // accessing launch.json parameters
        let launchConfig = getResolvedLaunchConfig()[0];
        let assemblyCode: string | undefined = launchConfig["program"];
        let assignmentCode: string | undefined = launchConfig["assignment"];

        // converting both to absolute paths
        if (!assemblyCode || !assignmentCode) {
            vscode.window.showErrorMessage("Please set the program and assignment in launch.json to run test cases.");
            return;
        }
        let binPath: string;
        if (!this.useLocalEmulator) {
            binPath = this.context.globalState.get("riscvemulator") as string;
        } else {
            binPath = this.localEmulatorPath;
        }
        let averageDi = 0;
        let averageSi = 0;
        let averageReg = 0;
        let averageMem = 0; 

        let completedTestCases = 0;
        let failedSeeds = 0;

        let output;
        outputChannel.show(true);
        outputChannel.appendLine("Running MultiExecute with amount: " + amount);
        const executor = new TestCaseExecutor(binPath, (result: TestCaseExecutionResult) => {
                    console.debug("Running seed: " + result.seed);
                    averageDi += result.di;
                    averageSi += result.si;
                    averageReg += result.regUsed;
                    averageMem += result.memUsed;
                    completedTestCases++;
                    if (result.status === "fail") {
                        outputChannel.appendLine(`Seed ${result.seed} failed`);
                        failedSeeds++;
                    }
                    if (completedTestCases === amount) {
                        averageDi /= amount;
                        averageSi /= amount;
                        averageReg /= amount;
                        averageMem /= amount;

                        averageDi = parseFloat(averageDi.toFixed(2));
                        averageSi = parseFloat(averageSi.toFixed(2));
                        averageReg = parseFloat(averageReg.toFixed(2));
                        averageMem = parseFloat(averageMem.toFixed(2));

                        outputChannel.appendLine("The metric results of your MultiExecute are: ");
                        if(failedSeeds === amount){
                            outputChannel.appendLine('All seeds failed, go through your program to ensure you have no errors ' +
                            'and that you have read the assignment write up carefully to ensure you are reporting your answers correctly.');
                        }
                        else{
                            outputChannel.appendLine(`Average DI: ${averageDi}, SI: ${averageSi}, Reg: ${averageReg}, Mem: ${averageMem}`);
                        }
                        let passPercentage = ((amount - failedSeeds) / amount) * 100;
                        outputChannel.appendLine(`Pass Rate: (${passPercentage}%)`);
                        outputChannel.appendLine('Note that the Pass Rate is not indicative of your final grade, please ensure to exhaustively test your code.');
                        output = [averageDi, averageSi, averageReg, averageMem];
                        //let output2;

                       
                        let pass: passIn = {
                            di: averageDi,
                            si: averageSi,
                            reg: averageReg,
                            mem: averageMem
                        };
                        console.log("inside " + output);
                        screenManager.openScreenPanel();
                        if (screenManager.getScreenPanel()) {
                            let workspaceFolders = vscode.workspace.workspaceFolders;
                        

                            let data = {
                                status: "done", 
                                stats: pass,
                            };
                            const screenPanel = screenManager.getScreenPanel();
                            if (screenPanel) {
                                console.log("attempting to post");
                                screenPanel.webview.postMessage({ command: "show_multi_screen", data: data });
                                console.log("after");
                            }

                            console.log(data);
                            screenManager.setMode("multi");
                            //return output;
                        }
                    }
                 });
        let seeds: string[] = [];
        for (let i = 0; i < amount; i++) {
            //push a random seed instead
            seeds.push(Math.floor(Math.random() * 1000000000).toString());
        }
        

        executor.execute(assignmentCode, assemblyCode, seeds);
        
        console.log("outside" + output);
        //return output;
    }

    public async debugTestCaseHandler(item: any) {
        // item should be a TestCase
        let title = item.label;
        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to debug test cases.");
            return;
        }
        const workspaceConfig = vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders![0]);
        const launchConfig = workspaceConfig["configurations"][0];

        // starting debug session
        launchConfig["seed"] = parseInt(seed);
        vscode.debug.startDebugging(workspaceFolders[0], launchConfig);
    }

    public deleteTestCase(item: any) {
        // item should be a TestCase
        let title = item.label;
        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to delete test cases.");
            return;
        }

        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        let testCasesFolder = path.join(workspaceRoot, ".vscode", "testcases");
        let testCasePath = path.join(testCasesFolder, title + "_" + seed + ".png");

        let fs = require('fs');
        fs.unlinkSync(testCasePath);

        // removing the test case from the list
        for (let i = 0; i < this.testCases.length; i++) {
            let testCase = this.testCases[i];
            if (testCase.label === title && testCase.description === seed) {
                this.testCases.splice(i, 1);
                this._onDidChangeTreeData.fire(undefined); // the root node has changed
                return;
            }
        }

    }

    public reportUpdatedStatus(seed: string, status: string, stats: any) {
        for (let i = 0; i < this.testCases.length; i++) {
            let testCase = this.testCases[i];
            if (testCase.description === seed) {
                testCase.updateIcon(status);
                testCase.stats = stats;
                this._onDidChangeTreeData.fire(testCase);
            }
        }
    }
}
