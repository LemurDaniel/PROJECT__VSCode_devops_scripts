const vscode = require('vscode')
const devops = require('../data/api')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')

async function command(context) {

    try {

        const user = await devops.User.current
        user.currentOrganization = await interaction.selectSingleFromOptions(user.organization.all).then(org => org.accountName)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = vscode.commands.registerCommand("devopsscripts.organization.select", command)