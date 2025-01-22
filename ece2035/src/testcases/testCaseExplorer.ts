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

type MultiScreenData = {
    status: string,
    stats: ProgramStats
};

type TotalProgramStats = {
    avgAll: ProgramStats,
    avgPassed: ProgramStats
};

type ProgramStats = {
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

    private program: string = "";
    private assignment: string = "";

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

        let seed = item.description;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0 || !workspaceFolders[0]) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return;
        }

        // accessing launch.json parameters
        let launchConfigs = getResolvedLaunchConfig();

        // likely to occur if a test was run outside of a code editor
        if (launchConfigs.length === 0) {
            item.updateIcon("fail");
            this._onDidChangeTreeData.fire(item);
            return;
        }

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

    private initializeMultiTest(context: vscode.ExtensionContext) {
        if (!screenManager) {
            screenManager = new ScreenManager(context);
        }

        // validate workspaces
        if (!this.validateWorkspaceFolders()) {
            return "";
        }

        // accessing launch.json parameters
        let [{ program, assignment }] = getResolvedLaunchConfig();

        this.program = program;
        this.assignment = assignment;

        // converting both to absolute paths
        if (!program || !assignment) {
            vscode.window.showErrorMessage("Please set the program and assignment in launch.json to run test cases.");
            return "";
        }

        let binPath: string;

        if (!this.useLocalEmulator) {
            binPath = this.context.globalState.get("riscvemulator") as string;
        } else {
            binPath = this.localEmulatorPath;
        }

        return binPath;
    }

    private validateWorkspaceFolders(): boolean {
        let workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders?.length) {
            vscode.window.showErrorMessage("No workspace is opened. Please open a workspace to run test cases.");
            return false;
        }

        return true;
    }

    private getFormattedPassAverage(passAvg: number, passedTestCases: number): number {
        // If the user passes zero test cases, there's a chance for a divide by 0
        if (passedTestCases === 0) {
            return 0;
        }

        return parseFloat((passAvg / passedTestCases).toFixed(2));
    }

    private getFormattedAverage(avg: number): number {
        return parseFloat((avg / this.testCases.length).toFixed(2));
    }

    private getFormattedStats({ avgAll: all, avgPassed: passed }: TotalProgramStats, passedTestCases: number): TotalProgramStats {
        return {
            avgAll: {
                si: this.getFormattedAverage(all.si),
                di: this.getFormattedAverage(all.di),
                mem: this.getFormattedAverage(all.mem),
                reg: this.getFormattedAverage(all.reg),
            },
            avgPassed: {
                si: this.getFormattedPassAverage(passed.si, passedTestCases),
                di: this.getFormattedPassAverage(passed.di, passedTestCases),
                mem: this.getFormattedPassAverage(passed.mem, passedTestCases),
                reg: this.getFormattedPassAverage(passed.reg, passedTestCases)
            }
        };
    }

    public async handleRunAllTestCases(context: vscode.ExtensionContext) {
        let binPath = this.initializeMultiTest(context);

        if (binPath.length === 0) {
            return;
        }

        let { avgAll, avgPassed }: TotalProgramStats = {
            avgAll: {
                di: 0,
                si: 0,
                reg: 0,
                mem: 0
            },
            avgPassed: {
                di: 0,
                si: 0,
                reg: 0,
                mem: 0
            }
        };

        let completedTestCases = 0;
        let passedTestCases = 0;

        let outputLog = "";

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

                    avgAll.di += result.di;
                    avgAll.si += result.si;
                    avgAll.reg += result.regUsed;
                    avgAll.mem += result.memUsed;

                    outputLog = outputLog + String(result.memUsed) + " \n";

                    if (result.status === "pass") {
                        avgPassed.di += result.di;
                        avgPassed.si += result.si;
                        avgPassed.reg += result.regUsed;
                        avgPassed.mem += result.memUsed;

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

                        let { avgAll: formattedAll, avgPassed: formattedPass } = this.getFormattedStats({ avgAll, avgPassed }, passedTestCases);

                        outputChannel.show(true);  // Make sure the Output Channel is visible
                        //put them all on the same line
                        if (passedTestCases === 0) {
                            outputLog += ('All test cases failed, go through your program to ensure you have no errors ' +
                                'and that you have read the assignment write up carefully to ensure you are reporting your answers correctly.\n');
                        }
                        else {
                            outputLog += (`Average Passed Test Cases DI: ${formattedPass.di}, SI: ${formattedPass.si}, Reg: ${formattedPass.reg}, Mem: ${formattedPass.mem}\n`);
                        }
                        // Optionally show information to the user if not in debug mode
                        vscode.window.showInformationMessage(
                            `Test Case Averages: DI=${formattedAll.di}, SI=${formattedAll.si}, Reg=${formattedAll.reg}, Mem=${formattedAll.mem}`
                        );

                        screenManager.openScreenPanel();

                        if (screenManager.getScreenPanel()) {
                            let data: MultiScreenData = {
                                status: "done",
                                stats: formattedPass,
                            };

                            const screenPanel = screenManager.getScreenPanel();

                            if (screenPanel) {
                                screenManager.postCommand({ command: "show_multi_screen", data: data, log: outputLog });
                            }

                            console.log(data);
                            screenManager.setMode("multi");
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

        executor.execute(this.assignment, this.program, seeds);

    }

    public async handleMultiExecute(amount: number, context: vscode.ExtensionContext) {
        let binPath = this.initializeMultiTest(context);

        if (binPath.length === 0) {
            return;
        }

        let avgStats: ProgramStats = {
            di: 0,
            si: 0,
            reg: 0,
            mem: 0
        };

        let completedTestCases = 0;
        let failedSeeds = 0;

        let outputLog = "";

        outputChannel.show(true);
        outputLog += ("Running MultiExecute with amount: " + amount + "\n");
        const executor = new TestCaseExecutor(binPath, (result: TestCaseExecutionResult) => {
            console.debug("Running seed: " + result.seed);
            avgStats.di += result.di;
            avgStats.si += result.si;
            avgStats.reg += result.regUsed;
            avgStats.mem += result.memUsed;
            completedTestCases++;
            if (result.status === "fail") {
                outputLog += (`Seed ${result.seed} failed\n`);
                failedSeeds++;
            }
            if (completedTestCases === amount) {
                avgStats = {
                    di: this.getFormattedPassAverage(avgStats.di, amount),
                    si: this.getFormattedPassAverage(avgStats.si, amount),
                    mem: this.getFormattedPassAverage(avgStats.mem, amount),
                    reg: this.getFormattedPassAverage(avgStats.reg, amount),
                };

                if (failedSeeds === amount) {
                    outputLog += ('All seeds failed, go through your program to ensure you have no errors ' +
                        'and that you have read the assignment write up carefully to ensure you are reporting your answers correctly.\n');
                }

                let passPercentage = ((amount - failedSeeds) / amount) * 100;
                outputLog += (`Pass Rate: (${passPercentage}%)\n`);
                outputLog += ('Note that the Pass Rate is not indicative of your final grade, please ensure to exhaustively test your code.\n');

                screenManager.openScreenPanel();

                if (screenManager.getScreenPanel()) {

                    let data = {
                        status: "done",
                        stats: avgStats,
                    };
                    const screenPanel = screenManager.getScreenPanel();
                    if (screenPanel) {
                        screenManager.postCommand({ command: "show_multi_screen", data: data, log: outputLog });
                    }

                    console.debug(data);

                    screenManager.setMode("multi");
                }
            }
        });
        let seeds: string[] = [];
        for (let i = 0; i < amount; i++) {
            //push a random seed instead
            seeds.push(Math.floor(Math.random() * 1000000000).toString());
        }

        executor.execute(this.assignment, this.program, seeds);
    }

    public async debugTestCaseHandler(item: any) {
        // item should be a TestCase
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
