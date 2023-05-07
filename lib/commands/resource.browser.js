const vscode = require('vscode')
const output = require('../output')
const Repository = require('../data/repository')
const Pipeline = require('../data/pipeline')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        if (context instanceof Repository) {
            vscode.env.openExternal(vscode.Uri.parse(context.webUrl))
        }
        else if (context instanceof Pipeline) {
            vscode.env.openExternal(vscode.Uri.parse(context._links.web.href))
        }
        else if (context instanceof Pipeline.Build) {
            vscode.env.openExternal(vscode.Uri.parse(`${context._links.web.href}&view=logs`))
        }
        else if (context instanceof Repository.PullRequest) {
            vscode.env.openExternal(vscode.Uri.parse(context.webUrl))
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)