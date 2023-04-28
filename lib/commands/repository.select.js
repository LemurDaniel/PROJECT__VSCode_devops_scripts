const vscode = require('vscode')
const interaction = require('../utils/interaction')
const output = require('../output')

const RepositoryView = require('../repositoryView')
const Project = require('../data/project')


async function command(repository) {

    try {

        if (null == repository) {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }
        
        output.appendLine(`Selected '${repository.name}' on '${repository.localpath}'`)
        
        if (!repository.isDownloadedLocaly) return

        output.appendLine(`Found Repository Locally'`)

        RepositoryView.instance.select(repository)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand("devopsscripts.repository.select", command)