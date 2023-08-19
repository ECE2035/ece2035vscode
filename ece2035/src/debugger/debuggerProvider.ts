import * as vscode from 'vscode';

export class DebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    public constructor() {

    }

    provideDebugConfigurations(folder: vscode.WorkspaceFolder, token?: vscode.CancellationToken): vscode.DebugConfiguration[] {
        return [
            {
                type: "mipsvm",
                request: "launch",
                name: "Run Assembly",
                program: "${file}"
            }
        ]
    }
}