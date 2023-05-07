const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        output.appendLine("Invoked command: 'pullrequest.complete'")


        // ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)