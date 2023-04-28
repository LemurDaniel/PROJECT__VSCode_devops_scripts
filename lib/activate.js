const vscode = require('vscode')
const ProjectView = require('./projectView')
const RepositoryView = require('./repositoryView')

const commands = require('./commands/_commands')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    commands.forEach(disposable => context.subscriptions.push(disposable))
    context.subscriptions.push(RepositoryView.instance.disposable)
    context.subscriptions.push(ProjectView.instance.disposable)

}

module.exports = {
    activate
}
