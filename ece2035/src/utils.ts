import * as vscode from 'vscode';

export function getResolvedLaunchConfig() {
  // Access the workspace configuration for 'launch'
  const launchConfig = vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders![0]);

  // Get the configurations array from the 'launch' configuration
  const configs = launchConfig['configurations'];

  const currFile = vscode.window.activeTextEditor?.document.uri;

  if (!currFile) {
    vscode.window.showErrorMessage("The currently selected window is not a valid text editor.");

    return [];
  }

  console.log("Curr file was ", currFile);

  if (configs && Array.isArray(configs)) {
    // Iterate through configurations
    return configs.map(config => resolveVariables(config, vscode.workspace.workspaceFolders![0], currFile));
  }

  return [];
}

// Function to manually resolve workspace folder variables
function resolveVariables(config: any, folder: any, file: any) {
    // Regex to find VS Code variables e.g., ${workspaceFolder}
    const variablePatternWS = /\$\{workspaceFolder\}/g;
    const variablePatternFile = /\$\{file\}/g;

    // escaping the folder and file path strings
    const escapedFolder = folder.uri.fsPath.replace(/\\/g, '\\\\');
    const escapedFile = file.fsPath.replace(/\\/g, '\\\\');

    // Serialize the configuration object to a string
    let configString = JSON.stringify(config);

    // Replace all occurrences of ${workspaceFolder}
    configString = configString.replace(variablePatternWS, escapedFolder);
    configString = configString.replace(variablePatternFile, escapedFile);

    // Parse it back to an object
    return JSON.parse(configString);
}