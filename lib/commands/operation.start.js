const vscode = require('vscode')
const Pipeline = require('../data/pipeline')
const ProjectView = require('../projectView')

async function command(context) {

    try {

        if (context instanceof Pipeline) {
            await context.start()
            ProjectView.instance.refresh()
        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.operation.start", command)