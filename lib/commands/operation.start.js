const vscode = require('vscode')
const Pipeline = require('../data/pipeline')
const ProjectView = require('../projectView')

const interaction = require('../utils/interaction')

async function command(context) {

    try {

        if (context instanceof Pipeline) {

            const branches = await context.project.getRepositoryById(context.repository.id).then(repo => repo.branches)
            const selected = await interaction.selectFromOptions(branches)
            for(const branch of selected) {
                await context.start(branch)
            }
            ProjectView.instance.refresh()

        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.operation.start", command)