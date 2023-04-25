const vscode = require('vscode')
const Repository = require('../data/repository')
const Pipeline = require('../data/pipeline')

async function command(context) {

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


module.exports = vscode.commands.registerCommand("devopsscripts.resource.browser", command)