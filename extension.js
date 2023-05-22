const vscode = require('vscode')
const cache = require('./lib/data/cache')
const Project = require('./lib/data/project')
const ProjectView = require('./lib/projectView')
const RepositoryView = require('./lib/repositoryView')

const commands = require('./lib/commands/_commands')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    cache.init(context.globalStorageUri.fsPath)
    changeProjectPath()

    vscode.workspace.onDidChangeConfiguration(async change => {
        if (!change.affectsConfiguration('devops.custom_project_path'))
            return null

        changeProjectPath()
        await Project.all(true)
        await ProjectView.instance.refresh()
    })

    commands.forEach(disposable => context.subscriptions.push(disposable))
    context.subscriptions.push(RepositoryView.instance.disposable)
    context.subscriptions.push(ProjectView.instance.disposable)

}
// This method is called when your extension is deactivated
function deactivate(context) {
    context.subscriptions.forEach(disposable => disposable.dispose())
}

async function changeProjectPath() {
    try {
        Project.customPath = vscode.workspace.getConfiguration('devops').get('custom_project_path')
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
        vscode.window.showWarningMessage(`DevOps: Setting Projectpath to Default of '${Project.defaultPath}'`)
    }
}

module.exports = {
    activate,
    deactivate
}
