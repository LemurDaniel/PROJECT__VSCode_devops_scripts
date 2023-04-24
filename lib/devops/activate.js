const interaction = require('../utils/interaction')
const vscode = require('vscode')
const devops = require('./api')

const Project = require('./project')
const ProjectView = require('./projectView')
const Repository = require('./repository')
const Pipeline = require('./pipeline')

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


    disposable = vscode.commands.registerCommand("devopsscripts.repository.open", context => openRepository(context, true, false))
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.repository.download", context => openRepository(context, false, true))
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.openBrowser", openBrowser)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.operation.cancel", cancelOperation)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.operation.start", startOperation)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.resource.settings", setSettings)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devopsscripts.repository.create", createRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.window.createTreeView('devopsscripts.view.devops-projects', {
        title: "Projects",
        treeDataProvider: ProjectView.instance
    })
    context.subscriptions.push(disposable)

}

async function postTest() {

    const test = null //await User.current
    await vscode.window.showInformationMessage(JSON.stringify(test))
    return

}

async function openRepository(context, open = true, download = true) {

    try {

        let repository = null
        if (context instanceof Repository) {
            repository = context
        } else {
            const repositories = await interaction.selectSingleFromOptions(await Project.all).then(value => value.repositories)
            repository = await interaction.selectSingleFromOptions(repositories)
        }

        if (!fs.existsSync(repository.localpath)) {
            vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
        }
        else if (download) {
            const userConfirmation = await vscode.window.showWarningMessage(`Delete and Replace Local Repository '${repository.name}'`, "Yes", "No")
            if (userConfirmation == 'Yes') {
                fs.rmSync(repository.localpath, { recursive: true, force: true })
                vscode.commands.executeCommand('git.clone', repository.remoteUrl, repository.project.path)
            } else {
                return
            }
        }


        if (open) {
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
        project = await interaction.selectSingleFromOptions(await Project.all)
    }

    const repositoryName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Please, Enter a Repository Name'
    })

    try {
        await project.createRepository(repositoryName)
        ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function selectDefaultProjects() {

    try {

        const projects = Object.values(await Project.all)
            .sort((a, b) => {
                if (a.showUser == b.showUser) return 0
                else if (a.showUser == true) return -1
                else return 1
            })

        const projectNames = await interaction.selectFromOptions(projects, option => ({
            label: option.name,
            description: option.description,
            picked: option.showUser
        })).then(projects => projects.map(project => project.name))

        await Project.enable(projectNames)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function selectOrganization() {
    try {
        const user = await devops.User.current
        user.currentOrganization = await interaction.selectSingleFromOptions(user.organization.all).then(org => org.accountName)
        ProjectView.instance.refresh()
    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }
}

async function openBrowser(context) {

    try {

        if (context instanceof Repository) {
            vscode.env.openExternal(vscode.Uri.parse(context.webUrl))
        }
        else if (context instanceof Pipeline) {
            vscode.env.openExternal(vscode.Uri.parse(context._links.web.href))
        }
        else if (context instanceof Pipeline.Build) {
            vscode.env.openExternal(vscode.Uri.parse(context._links.web.href))
        }
        else if(context instanceof Repository.PullRequest) {
            vscode.env.openExternal(vscode.Uri.parse(context.webUrl))
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function startOperation(context) {

    try {

        if (context instanceof Pipeline) {
            const build = await context.start()
            ProjectView.instance.refresh()
        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function cancelOperation(context) {

    try {

        if (context instanceof Pipeline.Build) {
            await context.cancelBuild()
            ProjectView.instance.refresh()
        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

async function setSettings(context) {

    try {

        if (context instanceof Pipeline) {

            await context.updateSettings()
            ProjectView.instance.refresh()

        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = {
    activate
}
