const projectView = require('./projectViewDataProvider')
const interaction = require('./userinteraction')
const vscode = require('vscode')
const devops = require('./api')
const Project = require('./project')
const Repository = require('./repository')
const fs = require('fs')


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    let disposable = vscode.commands.registerCommand("devops.setPat", async () => devops.user_request_token())
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.test", postTest)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.project.select", selectDefaultProjects)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.organization.select", selectOrganization)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.repository.open", openRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.repository.download", downloadRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.repository.create", createRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.window.createTreeView('devopsscripts.view.devops-projects', {
        title: "Projects",
        treeDataProvider: projectView.instance
    })
    context.subscriptions.push(disposable)

}

async function postTest() {

    const test = null //await User.current
    await vscode.window.showInformationMessage(JSON.stringify(test))
    return

}

async function downloadRepository(context) {

    try {
        let repository = null
        if (context instanceof Repository) {
            repository = context
        } else {
            repository = await interaction.userPickRepositoryByProject()
        }

        if (fs.existsSync(repository.localpath)) {
            const userConfirmation = await vscode.window.showWarningMessage(`Delete and Replace Local Repository '${repository.name}'`, "Yes", "No")
            if (userConfirmation == 'Yes') {
                fs.rmSync(repository.localpath, { recursive: true, force: true })
            } else {
                return
            }
        }

        vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function openRepository(context) {

    try {
        let repository = null
        if (context instanceof Repository) {
            repository = context
        } else {
            repository = await interaction.userPickRepositoryByProject()
        }

        if (!fs.existsSync(repository.localpath)) {
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path);
        } else {
            const windowPoll = await vscode.window.showWarningMessage("Open Repository Window", "New", "Current")
            const uri = vscode.Uri.file(repository.localpath)

            if (windowPoll == 'New') {
                await vscode.commands.executeCommand('vscode.openFolder', uri, {
                    forceNewWindow: true,
                    noRecentEntry: false
                })
            } else if (windowPoll == 'Current') {
                await vscode.commands.executeCommand('vscode.openFolder', uri, {
                    forceNewWindow: false,
                    noRecentEntry: false
                })
            }
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function createRepository(project) {
    if (null == project) {
        project = await interaction.userPickRepositoryByProject()
    }

    const repositoryName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Please, Enter a Repository Name'
    })

    try {
        await project.createRepository(repositoryName)
        projectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }
}

async function selectDefaultProjects() {
    const projectsMap = await interaction.userSelectProjects()
    await Project.enable(projectsMap)
    projectView.instance.refresh()
}

async function selectOrganization() {
    try {
        const user = await devops.User.current
        user.organization.current = await interaction.userPickOrganization()
        projectView.instance.refresh()
        await vscode.window.showInformationMessage(JSON.stringify(user.organization.current))
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }
}

module.exports = {
    activate
}
