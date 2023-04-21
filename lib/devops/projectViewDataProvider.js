const vscode = require('vscode')
const Project = require('./project')


class ProjectViewDataProvider {

    static ViewItem = class ViewItem extends vscode.TreeItem {

        constructor(label, iconPath, collapsable = false, context) {
            super(label, collapsable ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
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

    constructor(workspaceRoot) { }




    async getTreeItem(element) {
        if (element instanceof Project) {
            const avatar = await element.avatar
            return new ProjectViewDataProvider.ViewItem(element.name, avatar, true, "projectContext")
        }
        else {
            const icon = new vscode.ThemeIcon('source-control')
            return new ProjectViewDataProvider.ViewItem(element.name, icon, false, "repositoryContext")
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


module.exports = ProjectViewDataProvider