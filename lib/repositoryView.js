const vscode = require('vscode')
const output = require('./output')
const fs = require('fs')

const Repository = require('./data/repository')

// Couldn't find a way to use the already existent file-explorer from vscode
class RepositoryView {

    static #instance

    static get instance() {
        if (null == this.#instance) {
            this.#instance = new RepositoryView()
        }
        return this.#instance
    }





    // Add and return new Eventemitter for change events
    #onDidChangeTreeData = new vscode.EventEmitter()
    get onDidChangeTreeData() {
        return this.#onDidChangeTreeData.event
    }

    get repository() {
        return this.#repository
    }

    #repository
    constructor() {
        this.#repository = null
        this.disposable = vscode.window.createTreeView('devopsscripts.view.devops-repository', {
            treeDataProvider: this
        })
    }



    async select(repository) {

        if (!(repository instanceof Repository))
            throw 'Not an instance of Repository'

        output.appendLine(`${this.constructor.name} Searching Branch for '${repository.name}'`)
        const branch = await repository.currentBranchLocal
        output.appendLine(`${this.constructor.name} Got Branch '${branch}'`)

        this.disposable.title = `Branch '${branch}' in '${repository.name}'`

        this.#repository = repository
        this.#onDidChangeTreeData.fire()
    }

    async getTreeItem(element) {

        const Collapsed = vscode.TreeItemCollapsibleState.Collapsed
        const Expanded = vscode.TreeItemCollapsibleState.Expanded
        const None = vscode.TreeItemCollapsibleState.None

        const collapsableState = element.meta.isDirectory() ? Collapsed : None
        const item = new vscode.TreeItem(element.name, collapsableState)

        if (element.meta.isDirectory()) {
            item.iconPath = new vscode.ThemeIcon('file-directory', new vscode.ThemeColor('symbolIcon.folderForeground'))
        }
        else if (element.meta.isFile()) {
            item.iconPath = new vscode.ThemeIcon('file', new vscode.ThemeColor('symbolIcon.fileForeground'))
            item.command = {
                command: "vscode.open",
                title: "Open in Preview",
                arguments: [vscode.Uri.file(element.path), { preview: true } ]
            }
        }

        return item
    }

    async getChildren(element) {

        if (null == this.repository) {
            return []
        }
        else if (null == element || element.meta.isDirectory()) {

            const path = null == element ? this.repository.localpath : element.path

            output.appendLine(`${this.constructor.name} searching on path '${path}'`)

            return fs.readdirSync(path).map(name => ({
                name: name,
                path: `${path}\\${name}`,
                meta: fs.lstatSync(`${path}\\${name}`)
            })).sort((a, b) => {
                if (a.meta.isDirectory() == b.meta.isDirectory()) return 0
                else if (a.meta.isDirectory()) return -1
                else return 1
            })

        }

    }

    refresh() {
        this.#onDidChangeTreeData.fire()
    }
}



module.exports = RepositoryView