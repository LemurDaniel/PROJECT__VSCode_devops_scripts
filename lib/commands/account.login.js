const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const devops = require('../data/api')
const ProjectView = require('../projectView')
const Project = require('../data/project')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)


    try {

        await devops.forceNewSession()
        await Project.all(true)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)