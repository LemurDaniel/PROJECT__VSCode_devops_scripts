const vscode = require('vscode')
const output = require('../output')

const ProjectView = require('../projectView')
const Pipeline = require('../data/pipeline')
const Repository = require('../data/repository')
const Folder = require('../utils/Folder')


const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        if (context instanceof Folder) {

            if (context.properties.contextValue == 'PipelinesFolderContext') {
                await context.properties.contextItem.getResources(Pipeline, true)
            }
            else if (context.properties.contextValue == 'RepositoriesFolderContext') {
                await context.properties.contextItem.getResources(Repository, true)
            }

            ProjectView.instance.refresh()

        }

        else if (context instanceof Pipeline) {
            await context.refresh()
            ProjectView.instance.refresh()
        }

        else if (context instanceof Repository) {
            await context.getResources(Repository.PullRequest, true)
            ProjectView.instance.refresh()
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)