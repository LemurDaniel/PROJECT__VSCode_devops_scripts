const vscode = require('vscode')
const output = require('../output')

const Pipeline = require('../data/pipeline')
const ProjectView = require('../projectView')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        if (context instanceof Pipeline.Build) {
            await context.cancelBuild()
            ProjectView.instance.refresh()
        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)