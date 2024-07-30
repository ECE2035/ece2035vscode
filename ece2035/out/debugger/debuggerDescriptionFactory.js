"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugDescriptorFactory = void 0;
const vscode = require("vscode");
class DebugDescriptorFactory {
    constructor(context, useLocalEmulator, localEmulatorPath) {
        this.context = context;
        this.useLocalEmulator = useLocalEmulator;
        this.localEmulatorPath = localEmulatorPath;
    }
    createDebugAdapterDescriptor(session, executable) {
        let command;
        if (!this.useLocalEmulator) {
            command = this.context.globalState.get("riscvemulator");
        }
        else {
            command = this.localEmulatorPath;
        }
        executable = new vscode.DebugAdapterExecutable(command, ['debug']);
        return executable;
    }
}
exports.DebugDescriptorFactory = DebugDescriptorFactory;
//# sourceMappingURL=debuggerDescriptionFactory.js.map