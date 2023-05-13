const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const RepositoryView = require('../repositoryView')
const Project = require('../data/project')


const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)


    try {

        let repository = RepositoryView.instance.repository

        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all()).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        output.appendLine(`Switching Branch for '${repository.name}' on '${repository.localpath}'`)
        if (!repository.isDownloadedLocaly) return
        output.appendLine(`Found Repository Locally'`)


        const branches = await repository.branches
        output.appendLine(`Found branches '${branches.map(v => v.name)}'`)
        const branch = await interaction.selectSingleFromOptions(branches)
        output.appendLine(`Selected Branch '${branch.name}'`)


        const out = await repository.setCurrentBranchLocal(branch)
        output.appendLine(`Switched Branch: ${out}`)


        RepositoryView.instance.select(repository)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)