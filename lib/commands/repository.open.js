const fs = require('fs')
const vscode = require('vscode')
const interaction = require('../utils/interaction')

const Repository = require('../data/repository')
const Project = require('../data/project')


async function command(context) {

    try {

        let repository = null
        if (context instanceof Repository) {
            repository = context
        } else {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        if (!fs.existsSync(repository.localpath)) {
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
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


module.exports = vscode.commands.registerCommand("devopsscripts.repository.open", command)