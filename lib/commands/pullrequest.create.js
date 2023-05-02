const fs = require('fs')
const vscode = require('vscode')
const interaction = require('../utils/interaction')

const output = require('../output')

const ProjectView = require('../projectView')
const Repository = require('../data/repository')
const Project = require('../data/project')


async function command(repository) {

    try {

        output.appendLine("Invoked command: 'pullrequest.create'")

        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }


        const remoteBranches = await repository.branches
        const localBranches = await repository.branchesLocal
            .then(branches => branches.filter(branch => !remoteBranches.map(v => v.name).includes(branch.name)))

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
            converter:    converter,
            placeHolder: 'Pick a Source Branch',
            title: 'Pick a Source Branch'
        }))

        branches = branches.filter(branch => branch != sourceBranch)
        const targetBranch = await interaction.selectSingleFromOptions(branches, ({
            converter: converter,
            placeHolder: 'Pick a Target Branch',
            title: 'Pick a Target Branch'
        }))

        output.appendLine(`Source Branch: ${sourceBranch.name}`)
        output.appendLine(`Target Branch: ${targetBranch.name}`)

        const test = repository.createPullRequest(sourceBranch, targetBranch)

        output.appendLine(`Check ${JSON.stringify(test)}`)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.pullrequest.create", command)