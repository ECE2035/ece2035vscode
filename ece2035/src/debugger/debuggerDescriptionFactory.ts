import * as vscode from 'vscode';

export class DebugDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        const command = "C:\\Users\\dcoop\\github\\riscvemulator\\RISC-V-Emulator\\riscvemulator.exe"; // this.context.globalState.get("riscvemulator") as string; // UNDO BEFORE COMMIT

        executable = new vscode.DebugAdapterExecutable(command, ['debug']);
        return executable;
    }
}