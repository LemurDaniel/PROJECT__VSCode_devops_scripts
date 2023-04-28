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

    constructor() {
        this.repository = null
    }



    select(repository) {

        if (!(repository instanceof Repository))
            throw 'Not an instance of Repository'

        this.repository = repository
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

}



module.exports = RepositoryView