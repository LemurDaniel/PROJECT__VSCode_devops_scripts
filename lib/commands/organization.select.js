const vscode = require('vscode')
const output = require('../output')
const devops = require('../data/api')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)


    try {

        const user = await devops.User.current
        const organization = await interaction.selectSingleFromOptions(user.organization.all)
        if (null == organization) return

        await user.setCurrentOrganization(organization.accountName)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)