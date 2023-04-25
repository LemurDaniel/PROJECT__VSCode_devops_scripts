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
            return vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
        }

        const userConfirmation = await vscode.window.showWarningMessage(`Delete and Replace Local Repository '${repository.name}'`, "Yes", "No")
        if (userConfirmation == 'Yes') {
            fs.rmSync(repository.localpath, { recursive: true, force: true })
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.repository.download", command)