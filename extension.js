const vscode = require('vscode')
const Project = require('./lib/data/project')
const ProjectView = require('./lib/projectView')
const RepositoryView = require('./lib/repositoryView')

const commands = require('./lib/commands/_commands')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    try {
        const customPath = vscode.workspace.getConfiguration('devops').get('custom_project_path')
        Project.customPath = customPath
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
        vscode.window.showWarningMessage(`DevOps: Setting Projectpath to Default of '${Project.defaultPath}'`)
    }

    commands.forEach(disposable => context.subscriptions.push(disposable))
    context.subscriptions.push(RepositoryView.instance.disposable)
    context.subscriptions.push(ProjectView.instance.disposable)

}
// This method is called when your extension is deactivated
function deactivate(context) {
	context.subscriptions.forEach(disposable => disposable.dispose())
}

module.exports = {
	activate,
	deactivate
}
