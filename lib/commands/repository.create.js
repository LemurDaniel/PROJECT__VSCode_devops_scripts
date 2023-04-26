const vscode = require('vscode')
const interaction = require('../utils/interaction')

const Project = require('../data/project')
const ProjectView = require('../projectView')

async function command(context) {

    try {

        if (null == context) {
            context = await interaction.selectSingleFromOptions(await Project.all)
        }
        else if (!(context instanceof Project)) {
            throw 'Not supported'
        }

        const repositoryName = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: 'Please, Enter a Repository Name'
        })

        await context.createRepository(repositoryName)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.repository.create", command)