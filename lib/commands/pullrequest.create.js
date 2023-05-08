const fs = require('fs')
const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')
const Project = require('../data/project')


const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


    try {

        let repository = context
        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }


        const remoteBranches = await repository.branchesRemote
        const remoteBranchesNames = remoteBranches.map(v => v.name)
        const localBranches = await repository.branches
            .then(branches =>
                branches.filter(branch => !remoteBranchesNames.includes(branch.name) && !branch.name.includes('origin'))
            )

        let branches = [...remoteBranches, ...localBranches]
            .sort((a, b) => {
                if (a.name < b.name) return -1
                else if (a.name > b.name) return 1
                else return 0
            })
            .sort((a, b) => {
                if (a.type == b.type) return 0
                else if (a.type == Repository.Branch.REMOTE) return -1
                else return 1
            })

        const converter = branch => ({
            label: branch.name,
            description: `${branch.type} - ${branch.creator?.displayName ?? branch.creator}`
        })

        const sourceBranch = await interaction.selectSingleFromOptions(branches, ({
            converter: converter,
            placeHolder: 'Pick a Source Branch',
            title: 'Pick a Source Branch'
        }))
        if (null == sourceBranch) return

        branches = branches.filter(branch => branch != sourceBranch)
        const targetBranch = await interaction.selectSingleFromOptions(branches, ({
            converter: converter,
            placeHolder: 'Pick a Target Branch',
            title: 'Pick a Target Branch'
        }))
        if (null == targetBranch) return

        const pullRequestTitle = await vscode.window.showInputBox({
            title: "Enter a PullRequest Titel",
            placeHolder: "...Title"
        })
        if (null == pullRequestTitle || pullRequestTitle.length == 0) return

        output.appendLine(`Source Branch: ${sourceBranch.name}`)
        output.appendLine(`Target Branch: ${targetBranch.name}`)
        output.appendLine(`Title: ${pullRequestTitle}`)

        const pullRequest = await repository.createPullRequest(pullRequestTitle, sourceBranch, targetBranch)

        output.appendLine(`Check ${JSON.stringify(pullRequest)}`)

        ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)