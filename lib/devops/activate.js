const interaction = require('./userinteraction')
const vscode = require('vscode')
const devops = require('./api')
const Project = require('./project')
const fs = require('fs')

class ProjectViewDataProvider {

    static #instance

    static get instance() {
        if (null == this.#instance) {
            this.#instance = new ProjectViewDataProvider()
        }
        return this.#instance
    }

    // Add and return new Eventemitter for change events
    #onDidChangeTreeData = new vscode.EventEmitter()
    get onDidChangeTreeData() {
        return this.#onDidChangeTreeData.event
    }

    constructor(workspaceRoot) { }

    getTreeItem(element) {
        if (element instanceof Project) {
            return {
                label: element.name,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
            };
        }
        else {
            return {
                label: element.name,
                collapsibleState: vscode.TreeItemCollapsibleState.None
            };
        }
    }

    async getChildren(element) {
        if (null == element) {
            return Object.values(await Project.all).filter(val => val.showUser)
        }
        else if (element instanceof Project) {
            return (await Project.getByName(element.name)).repositories
        }
        else return null
    }

    refresh() {
        // fire event from onDidChangeTreeData Event Emitter.
        this.#onDidChangeTreeData.fire()
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    let disposable = vscode.commands.registerCommand("devops.setPat", async () => devops.user_request_token())
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.test", postTest)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.selectProjects", selectDefaultProjects)
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("devops.openRepository", openRepository)
    context.subscriptions.push(disposable)

    disposable = vscode.window.createTreeView('devops-projects', {
        title: "Projects",
        treeDataProvider: ProjectViewDataProvider.instance
    })
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


async function selectDefaultProjects() {
    const projectsMap = await interaction.userSelectProjects()
    await Project.enable(projectsMap)
    ProjectViewDataProvider.instance.refresh()
}


module.exports = {
    activate
}
