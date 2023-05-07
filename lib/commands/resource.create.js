const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const Folder = require('../utils/Folder')
const Repository = require('../data/repository')
const ProjectView = require('../projectView')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        if (context instanceof Folder) {

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


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)