import * as vscode from 'vscode';

export class DebugDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        const command = "C:\\Users\\dcoop\\github\\mipsemulator\\mipsemulator.exe";

        executable = new vscode.DebugAdapterExecutable(command);
        return executable;
    }
}