const fs = require('fs')
const vscode = require('vscode')
const devops = require('../data/api')
const output = require('../output')
const utility = require('../utils/utility')
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
            const repositories = await interaction.selectSingleFromOptions(await Project.all()).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        if (!fs.existsSync(repository.localpath)) {
            await vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path).then(async data => {
                if(!vscode.workspace.getConfiguration('devops').get('git_set_local_config')) return
                const user = await devops.User.current
                await utility.execute(`git config --local user.email "${user.emailAddress}"`, repository.localpath)
                await utility.execute(`git config --local user.name "${user.displayName}"`, repository.localpath)
            })
            return
        }

        const userConfirmation = await vscode.window.showWarningMessage(`Delete and Replace Local Repository '${repository.name}'`, "Yes", "No")
        if (userConfirmation == 'Yes') {
            fs.rmSync(repository.localpath, { recursive: true, force: true })
            await vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path).then(async data => {
                if(!vscode.workspace.getConfiguration('devops').get('git_set_local_config')) return
                const user = await devops.User.current
                await utility.execute(`git config --local user.email "${user.emailAddress}"`, repository.localpath)
                await utility.execute(`git config --local user.name "${user.displayName}"`, repository.localpath)
            })
            ProjectView.instance.refresh()
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)