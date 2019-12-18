import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

//the main function of an extenion, it get's called when the extension is activated
export function activate(this: any, context: vscode.ExtensionContext) {
    const myContext = this;
    //first we need to get some infomation from the user with vscode configuration 
    let config  = vscode.workspace.getConfiguration("vsql-developer");
    let sqlclPfad = <string> config.get("sqlcl");
    let workspacePath = <string> vscode.workspace.rootPath;
    //finds out if the SQLcl path is absolute, relative or just the global constant
    if(sqlclPfad.startsWith(":", 1)){
        let relativePath = path.relative(workspacePath,sqlclPfad);
        myContext.sqlclPath = relativePath;
    }
    else{
        myContext.sqlclPath = config.get("sqlcl");
    }
    //gets all connectionstrings from database_connectionstrings file
    let connectionStrings_file = path.join(workspacePath, "database_connectionStrings.json");
    let connectionStrings = JSON.parse(fs.readFileSync(connectionStrings_file).toString());
    let targets = connectionStrings.map((target: { label: any; targetName: any; }) => {
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

//picks the connection String based on amount of available options and calls compileScript method  
function chooseConnection(databases: any, conStrings: any,sqlclPath:any ){
    if (conStrings.length === 0){
		vscode.window.showWarningMessage("No connections defined");
	}
	else if (conStrings.length === 1){
        vscode.window.showWarningMessage(databases[0].connectionString);
        var dataset = databases[0].connectionString;
        compilescript(dataset, sqlclPath);
	}
	else{
		vscode.window.showQuickPick(conStrings)
		.then(selected => {
			if(selected){
                var dataset = <any> selected;
                var datasetString = dataset.connectionString;
                compilescript(datasetString, sqlclPath);
			}
		});
	}
}

// finally passes all the paths to the compilePlsql TASK which executes the current files (PL)SQL
// code in SQLcl and then provides information for the problem matcher
function compilescript(datastring: any, sqlclPath:any){
    let compilePath = path.resolve(__dirname, '..', 'resource', 'connect.bat');
    let logmeinPath = path.resolve(__dirname, '..', 'resource', 'logmein.sql');
    let errorPath   = path.resolve(__dirname, '..', 'resource', '_show_errors.sql');
    let type = "compile PlSQL";
    let execution  = new vscode.ShellExecution(compilePath,[sqlclPath,logmeinPath,datastring,"${file}", errorPath]);
    vscode.tasks.executeTask(new vscode.Task({type: type}, vscode.TaskScope.Workspace,
        "Run", "compile PlSQL", execution, ["$plsqlpm"]));

}

export function deactivate() {}
