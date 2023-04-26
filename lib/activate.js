const vscode = require('vscode')
const ProjectView = require('./projectView')

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

}

module.exports = {
    activate
}
