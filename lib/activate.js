const vscode = require('vscode')
const ProjectView = require('./projectView')
const RepositoryView = require('./repositoryView')

const commands = require('./commands/_commands')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    commands.forEach(disposable => context.subscriptions.push(disposable))

    let disposable = vscode.window.createTreeView('devopsscripts.view.devops-projects', {
        title: "Projects",
        treeDataProvider: ProjectView.instance
    })
    context.subscriptions.push(disposable)

    disposable = vscode.window.createTreeView('devopsscripts.view.devops-repository', {
        title: "Repository",
        treeDataProvider: RepositoryView.instance
    })
    context.subscriptions.push(disposable)

}

module.exports = {
    activate
}
