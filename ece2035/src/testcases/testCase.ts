import * as vscode from 'vscode';
import * as path from 'path';

export class TestCase extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public status: string = 'unknown'
    ) {
        super(label);

        // icons are circle-outline, pass, close, and watch
        this.updateIcon(status);
        //this.contextValue += "deletable";

        if (status === "") {
            // dummy value, isn't a real test case
            this.contextValue = "dummyItem";
        } else {
            this.contextValue = "testcase";
            this.command = {
                command: 'ece2035.viewTestCase',
                title: 'View Test Case',
                arguments: [this]
            };
        }
    }

    updateIcon(status: string) {
        if (status === 'pass') {
            // green
            this.iconPath = {
                light: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'light', 'status-ok.svg')),
                dark: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'dark', 'status-ok.svg'))
            };
        } else if (status === 'fail') {
            this.iconPath = {
                light: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'light', 'status-error.svg')),
                dark: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'dark', 'status-error.svg'))
            };
        } else if (status === 'running') {
            this.iconPath = new vscode.ThemeIcon('watch');
        } else if (status === 'unknown') {
            this.iconPath = {
                light: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'light', 'status-unknown.svg')),
                dark: vscode.Uri.file(path.join(__dirname, '../', '../', 'resources', 'dark', 'status-unknown.svg'))
            };
        }
    }
}