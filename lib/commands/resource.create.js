const vscode = require('vscode')
const ouput = require('../output')
const interaction = require('../utils/interaction')

const Folder = require('../utils/Folder')
const Repository = require('../data/repository')
const ProjectView = require('../projectView')


async function command(context) {

    try {

        ouput.appendLine("Invoked command 'resource.create'")
        ouput.appendLine(JSON.stringify(context))

        if (null == context)
            return

        else if (context instanceof Folder) {

            if (context.properties.contextValue == 'PipelinesFolderContext') {
                throw new Error('Not implemented')
            }
            else if (context.properties.contextValue == 'RepositoriesFolderContext') {
                const repositoryName = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: 'Please, Enter a Repository Name'
                })

                await context.properties.contextItem.createRepository(repositoryName)
                ProjectView.instance.refresh()
            }
        }

        else if (context instanceof Repository) {
            throw new Error('Not implemented')
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.resource.create", command)