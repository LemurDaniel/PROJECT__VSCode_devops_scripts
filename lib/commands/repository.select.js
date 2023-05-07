const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const RepositoryView = require('../repositoryView')
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

        output.appendLine(`Selected '${repository.name}' on '${repository.localpath}'`)
        RepositoryView.instance.select(repository)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)