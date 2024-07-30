"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCaseExecutionResult = exports.TestCaseExecutor = void 0;
const vscode = require("vscode");
class TestCaseExecutor {
    constructor(binaryPath, resultCallback) {
        this.binaryPath = binaryPath;
        this.resultCallback = resultCallback;
    }
    execute(assignmentPath, assemblyPath, seeds) {
        // running the binary and capturing stdout
        const { exec } = require('child_process');
        let seedStr = seeds.join(",");
        let cmd = `"${this.binaryPath}" runBatch "${assemblyPath}" "${assignmentPath}" "${seedStr}"`;
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            // added code to extract out json substrings based on { } delimiters
            // rather than /n which doesn't always separate consecutive json strings)
            var getDelimiterIndices = (s, t1, t2) => {
                return [...s].flatMap((char, i) => (((char === t1) || (char === t2)) ? i : []));
            };
            let curlyIndices = getDelimiterIndices(stdout, '{', '}');
            let topOpen = curlyIndices[0];
            let count = 0;
            let lines = [];
            for (let i = 0; i < curlyIndices.length; i++) {
                let currentIdx = curlyIndices[i];
                count += ((stdout.charAt(currentIdx) === '{') ? 1 : -1);
                if (count === 0) {
                    lines.push(stdout.substring(topOpen, currentIdx + 1));
                    if (i + 1 < curlyIndices.length) {
                        topOpen = curlyIndices[i + 1];
                    }
                }
            }
            for (let i = 0; i < lines.length; i++) {
                // skip lines that are empty or not in the form of a json string
                let lineObj = lines[i];
                try {
                    lineObj = JSON.parse(lines[i]);
                }
                catch (e) {
                    //console.log("failed to parse line", i);
                    continue;
                }
                if (lineObj.type === "error") {
                    // show this error in a message box
                    vscode.window.showErrorMessage(lineObj.body);
                }
                else if (lineObj.type === "result") {
                    let seed = lineObj.body.seed;
                    let status = lineObj.body.passed ? "pass" : "fail";
                    let di = lineObj.body.di;
                    let si = lineObj.body.si;
                    let reg = lineObj.body.regs;
                    let mem = lineObj.body.mem;
                    let numErrors = lineObj.body.numErrors;
                    let b64Img = lineObj.body.img;
                    let result = new TestCaseExecutionResult(seed, status, di, si, reg, mem, b64Img, numErrors);
                    this.resultCallback(result);
                }
            }
        });
    }
}
exports.TestCaseExecutor = TestCaseExecutor;
class TestCaseExecutionResult {
    constructor(seed, status, di, si, reg, mem, b64Img, numErrors) {
        this.seed = seed;
        this.status = status;
        this.di = di;
        this.si = si;
        this.regUsed = reg;
        this.memUsed = mem;
        this.b64Img = b64Img;
        this.numErrors = numErrors;
    }
    getPNGImageAsB64() {
        return this.b64Img;
    }
}
exports.TestCaseExecutionResult = TestCaseExecutionResult;
//# sourceMappingURL=testCaseExecution.js.map