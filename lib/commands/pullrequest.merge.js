const vscode = require('vscode')
const output = require('../output')
const devops = require('../data/api')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {


        if (!(context instanceof Repository.PullRequest))
            throw new Error(`Expected '${Repository.PullRequest.constructor.name}' got '${context.constructor.name}'`)

        const mergeStrategy = await interaction.selectSingleFromOptions([
            {
                stragegy: "noFastForward",
                name: "Merge (no fast forward)",
                description: "Nonlinear history preserving all commits"
            },
            {
                stragegy: "squash",
                name: "Squash commit",
                description: "Linear history with only single commit on target"
            },
            {
                stragegy: "rebase",
                name: "Rebase and fast-forward",
                description: "Rebase source commits onto target and fast-forward"
            },
            {
                stragegy: "rebaseMerge",
                name: "Semi-linear merge",
                description: "Rebase source commits onto target and create a two parent merge"
            },
        ], {
            title: "Choose a merge Stragey"
        })
        if (null == mergeStrategy) return

        const deleteSourceBranch = await interaction.selectSingleFromOptions([
            {
                name: "Yes",
                description: "Delete Source Branch"
            },
            {
                name: "No",
                description: "Don't Delete Source Branch"
            }
        ], {
            title: "Delete Source Branch?"
        })
        if (null == deleteSourceBranch) return


        await context.update({
            AutoCompleteSetBy: {
                id: await devops.User.current.then(user => user.identity.id)
            },
            CompletionOptions: {
                deleteSourceBranch: deleteSourceBranch.name == 'Yes',
                mergeStrategy: mergeStrategy.stragegy
            }
        })

        ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)