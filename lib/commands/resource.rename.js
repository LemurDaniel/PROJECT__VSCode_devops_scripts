const vscode = require('vscode')
const interaction = require('../utils/interaction')

const output = require('../output')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')


async function command(context) {

    try {

        if (context instanceof Repository.PullRequest) {

            const newTitle = await vscode.window.showInputBox({
                title: "Enter a PullRequest Title",
                placeHolder: "...Title"
            })

            output.appendLine(`'${context.title}' to '${newTitle}'`)
           const test = await context.update({
                title: newTitle
            })

            output.appendLine(JSON.stringify(test))

            ProjectView.instance.refresh()

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = vscode.commands.registerCommand("devopsscripts.resource.rename", command)