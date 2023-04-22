const vscode = require('vscode')
const Project = require('./project')
const Repository = require('./repository')

class ProjectViewDataProvider {

    static ViewItem = class ViewItem extends vscode.TreeItem {

        constructor(label, iconPath, collapsable = false, context, description = '') {
            super(label, collapsable ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
            this.description = description
            this.iconPath = iconPath
            this.contextValue = context
        }

    }




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

    constructor() { }




    async getTreeItem(element) {
        if (element instanceof Project) {
            const avatar = await element.avatar
            return new ProjectViewDataProvider.ViewItem(element.name, avatar, true, "projectContext")
        }
        else if (element instanceof Repository) {
            const icon = element.isDisabled ? new vscode.ThemeIcon('ellipsis') : new vscode.ThemeIcon('code')
            const description = element.isDisabled ? "disabled" : ""
            const collapsable = !element.isDisabled
            return new ProjectViewDataProvider.ViewItem(element.name, icon, collapsable, "repositoryContext", description)
        }
        else if (element instanceof Repository.Branch) {
            const icon = new vscode.ThemeIcon('git-branch')
            return new ProjectViewDataProvider.ViewItem(element.name, icon, false, "repositoryBranchContext")
        }
    }

    async getChildren(element) {
        if (null == element) {
            return Object.values(await Project.all).filter(val => val.showUser)
        }
        else if (element instanceof Project) {
            return await element.repositories
        }
        else if (element instanceof Repository) {
            return await element.branches
        }
        else return null
    }

    refresh() {
        // fire event from onDidChangeTreeData Event Emitter.
        this.#onDidChangeTreeData.fire()
    }
}


module.exports = ProjectViewDataProvider