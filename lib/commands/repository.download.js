const fs = require('fs')
const vscode = require('vscode')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')
const Project = require('../data/project')


async function command(repository) {

    try {

        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        if (!fs.existsSync(repository.localpath)) {
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
            ProjectView.instance.refresh()
            return
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