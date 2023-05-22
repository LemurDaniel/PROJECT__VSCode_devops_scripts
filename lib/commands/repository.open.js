const fs = require('fs')
const vscode = require('vscode')
const devops = require('../data/api')
const output = require('../output')
const utility = require('../utils/utility')
const interaction = require('../utils/interaction')

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

        
        if (!fs.existsSync(repository.project.path)) {
            fs.mkdirSync(repository.project.path, {
                recursive: true
            })
        }

        if (!fs.existsSync(repository.localpath)) {

            await vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
            await ProjectView.instance.refresh()

            if (vscode.workspace.getConfiguration('devops').get('set_local_git_user')) {
                const user = await devops.User.current
                await utility.execute(`git config --local user.email "${user.emailAddress}"`, repository.localpath)
                await utility.execute(`git config --local user.name "${user.displayName}"`, repository.localpath)
            }
        }

        const windowPoll = await vscode.window.showWarningMessage("Open Repository in", "New Window", "Current")
        if (windowPoll == 'New Window') {
            await vscode.commands.executeCommand('vscode.openFolder',
                vscode.Uri.file(repository.localpath), {
                forceNewWindow: true,
                noRecentEntry: false
            })
        } else if (windowPoll == 'Current') {
            await vscode.commands.executeCommand('vscode.openFolder',
                vscode.Uri.file(repository.localpath), {
                forceNewWindow: false,
                noRecentEntry: false
            })
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)