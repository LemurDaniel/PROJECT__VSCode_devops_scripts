const interaction = require('./userinteraction')
const vscode = require('vscode')
const devops = require('./api')
const Project = require('./project')
const fs = require('fs')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    let disposable = vscode.commands.registerCommand("devops.setPat", async () => devops.user_request_token())
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.test", postTest)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.openRepository", openRepository)
    context.subscriptions.push(disposable)
}

async function postTest() {

    try {
        const repository = await devops.post({
            project: 'DC ACF Redeployment',
            scope: 'PROJ',
            api: '/_apis/git/repositories?api-version=7.0',
            body: {
                name: "new-test-repository2"
            }
        })
        await Project.getByName('DC ACF Redeployment', true)
        await vscode.window.showInformationMessage(JSON.stringify(repository))
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function openRepository() {

    try {
        const repository = await interaction.userPickRepositoryByProject()

        if (!fs.existsSync(repository.localpath)) {
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.projectpath);
        } else {
            const windowPoll = await vscode.window.showWarningMessage("Open Repository Window", "New", "Current")
            const uri = vscode.Uri.file(repository.localpath)
            await vscode.commands.executeCommand('vscode.openFolder', uri, {
                forceNewWindow: (windowPoll == 'New'),
                noRecentEntry: false
            })
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = {
    activate
}
