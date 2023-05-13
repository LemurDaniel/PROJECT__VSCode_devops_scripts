const fs = require('fs')
const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const Repository = require('../data/repository')
const Project = require('../data/project')


const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        let repository = context
        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all()).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        if (!fs.existsSync(repository.localpath)) {
            await vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
        }

        const windowPoll = await vscode.window.showWarningMessage("Open Repository in", "New Window", "Current")
        const uri = vscode.Uri.file(repository.localpath)

        if (windowPoll == 'New Window') {
            await vscode.commands.executeCommand('vscode.openFolder', uri, {
                forceNewWindow: true,
                noRecentEntry: false
            })
        } else if (windowPoll == 'Current') {
            await vscode.commands.executeCommand('vscode.openFolder', uri, {
                forceNewWindow: false,
                noRecentEntry: false
            })
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)