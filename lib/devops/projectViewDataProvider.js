const vscode = require('vscode')
const Project = require('./project')
const Repository = require('./repository')
const Pipeline = require('./pipeline')
const utility = require('../utils/utility')

class ProjectViewDataProvider {

    static ViewItem = class ViewItem extends vscode.TreeItem {

        constructor(label, iconPath, collapsable = false, context, description = '') {
            super(label, collapsable ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
            this.description = description
            this.iconPath = iconPath
            this.contextValue = context
        }

    }

    static ItemContainer = class ItemContainer {

        constructor(label, items) {
            this.label = label
            this.items = items
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
        else if (element instanceof ProjectViewDataProvider.ItemContainer) {
            const icon = new vscode.ThemeIcon('folder')
            return new ProjectViewDataProvider.ViewItem(element.label, icon, true, "repositoryContainerContext")
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
        else if (element instanceof Pipeline) {
            const icon = new vscode.ThemeIcon('rocket')
            return new ProjectViewDataProvider.ViewItem(element.name, icon, false, "pipelineContext")
        }
    }

    async getChildren(element) {
        if (null == element) {
            return Object.values(await Project.all).filter(val => val.showUser)
        }
        else if (element instanceof ProjectViewDataProvider.ItemContainer) {
            return element.items instanceof Promise ? await element.items : element.items
        }
        else if (element instanceof Project) {

            const groupElements = resources => {
                const groupings = utility.groupSimilar(resources, 4, 8, resource => resource.name)
                if (groupings.groupCount == 1 && groupings.ungrouped.length == 0)
                    return resources

                return [
                    ...Object.entries(groupings.grouped)
                        .map(([prefix, resource]) => new ProjectViewDataProvider.ItemContainer(prefix, resource)),
                    ...groupings.ungrouped
                ]
            }
            return [
                new ProjectViewDataProvider.ItemContainer('Pipelines', element.pipelines.then(groupElements)),
                new ProjectViewDataProvider.ItemContainer('Repositories', element.repositories.then(groupElements))
            ]

        }
        else if (element instanceof Repository) {
            const branches = await element.branches
            const groupings = utility.groupSimilar(branches, 4, 8, branch => branch.name)
            if (groupings.groupCount == 1 && groupings.ungrouped.length == 0)
                return branches

            return [
                ...Object.entries(groupings.grouped)
                    .map(([prefix, branches]) => new ProjectViewDataProvider.ItemContainer(prefix, branches)),
                ...groupings.ungrouped
            ]
        }
        else return null
    }

    refresh() {
        // fire event from onDidChangeTreeData Event Emitter.
        this.#onDidChangeTreeData.fire()
    }
}


module.exports = ProjectViewDataProvider