const vscode = require('vscode')
const ProjectView = require('./projectView')
const Project = require('./data/Project')

const interaction = require('./utils/interaction')
const commands = require('./commands/_commands')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    commands.forEach(disposable => context.subscriptions.push(disposable))

    let disposable = vscode.commands.registerCommand("devopsscripts.repository.create", createRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.window.createTreeView('devopsscripts.view.devops-projects', {
        title: "Projects",
        treeDataProvider: ProjectView.instance
    })
    context.subscriptions.push(disposable)

}

async function createRepository(project) {

    if (null == project) {
        project = await interaction.selectSingleFromOptions(await Project.all)
    }

    const repositoryName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Please, Enter a Repository Name'
    })

    try {
        await project.createRepository(repositoryName)
        ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = {
    activate
}
