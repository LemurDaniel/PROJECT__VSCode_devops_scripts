const vscode = require('vscode')
const interaction = require('../utils/interaction')

const output = require('../output')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')
const Project = require('../data/project')


async function command(pullRequest) {

    try {

        output.appendLine("Invoked command: 'pullrequest.complete'")


        // ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.pullrequest.complete", command)