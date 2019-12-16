"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
//the main function of an extenion, it get's called when the extension is activated
function activate(context) {
    const myContext = this;
    //first we need to get some infomation from the user with vscode configuration 
    let config = vscode.workspace.getConfiguration("vsql-developer");
    //finds out if the SQLcl path is absolute, relative or just the global constant
    if (config.get("sqlcl").startsWith(":", 1)) {
        let absolutePath = config.get("sqlcl");
        let relativePath = path.relative(vscode.workspace.rootPath, absolutePath);
        myContext.sqlclPath = relativePath;
    }
    else {
        myContext.sqlclPath = config.get("sqlcl");
    }
    //gets all connectionstrings from database_connectionstrings file
    let connectionStrings_file = path.join(vscode.workspace.rootPath, "database_connectionStrings.json");
    let connectionStrings = JSON.parse(fs.readFileSync(connectionStrings_file).toString());
    let targets = connectionStrings.map((target) => {
        target.label = target.targetName;
        return target;
    });
    //sets up the compileCommand which calls chooseConnection method
    let compileCommand = vscode.commands.registerCommand("vsql-developer.compile", () => {
        vscode.window.showInformationMessage("Choose connection");
        chooseConnection(connectionStrings, targets, myContext.sqlclPath);
    });
    context.subscriptions.push(compileCommand);
}
exports.activate = activate;
//picks the connection String based on amount of available options and calls compileScript method  
function chooseConnection(databases, conStrings, sqlclPath) {
    if (conStrings.length === 0) {
        vscode.window.showWarningMessage("No connections defined");
    }
    else if (conStrings.length === 1) {
        vscode.window.showWarningMessage(databases[0].connectionString);
        var dataset = databases[0].connectionString;
        compilescript(dataset, sqlclPath);
    }
    else {
        vscode.window.showQuickPick(conStrings)
            .then(selected => {
            if (selected) {
                var dataset2 = selected.connectionString;
                compilescript(dataset2, sqlclPath);
            }
        });
    }
}
// finally passes all the paths to the compilePlsql TASK which executes the current files (PL)SQL
// code in SQLcl and then provides information for the problem matcher
function compilescript(datastring, sqlclPath) {
    let compilePath = path.resolve(__dirname, '..', 'resource', 'connect.bat');
    let logmeinPath = path.resolve(__dirname, '..', 'resource', 'logmein.sql');
    let errorPath = path.resolve(__dirname, '..', 'resource', '_show_errors.sql');
    let type = "compile PlSQL";
    let execution = new vscode.ShellExecution(compilePath, [sqlclPath, logmeinPath, datastring, "${file}", errorPath]);
    vscode.tasks.executeTask(new vscode.Task({ type: type }, vscode.TaskScope.Workspace, "Run", "compile PlSQL", execution, ["$plsqlpm"]));
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map