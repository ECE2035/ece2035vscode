"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugConfigurationProvider = void 0;
class DebugConfigurationProvider {
    constructor() {
    }
    provideDebugConfigurations(folder, token) {
        return [
            {
                type: "riscv-vm",
                request: "launch",
                name: "Run Assembly",
                program: "${file}"
            }
        ];
    }
}
exports.DebugConfigurationProvider = DebugConfigurationProvider;
//# sourceMappingURL=debuggerProvider.js.map