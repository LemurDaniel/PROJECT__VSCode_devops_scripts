const vscode = require('vscode')
const output = require('../output')

const utility = require('../utils/utility')
const interaction = require('../utils/interaction')

const RepositoryView = require('../repositoryView')
const Project = require('../data/project')


async function command() {

    try {

        let repository = RepositoryView.instance.repository

        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        output.appendLine(`Switching Branch for '${repository.name}' on '${repository.localpath}'`)

        if (!repository.isDownloadedLocaly) return

        output.appendLine(`Found Repository Locally'`)

        const branches = await repository.branchesLocal
        output.appendLine(`Found branches '${branches}'`)

        const branch = await interaction.selectSingleFromOptions(branches)
        output.appendLine(`Selected Branch '${branch}'`)

        const out = await repository.setCurrentBranchLocal(branch)
        output.appendLine(`Switched Branch: ${out}`)

        RepositoryView.instance.select(repository)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.repository.switchBranch", command)