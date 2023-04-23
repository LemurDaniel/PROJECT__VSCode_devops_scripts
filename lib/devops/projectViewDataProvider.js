const vscode = require('vscode')
const Project = require('./project')
const Repository = require('./repository')
const Pipeline = require('./pipeline')
const Folder = require('../utils/Folder')
const utility = require('../utils/utility')


class ProjectViewDataProvider {

    static ViewItem = class ViewItem extends vscode.TreeItem {

        constructor(label, iconPath, collapsableState, context, description = '') {
            super(label, collapsableState)
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

        const Collapsed = vscode.TreeItemCollapsibleState.Collapsed
        const Expanded = vscode.TreeItemCollapsibleState.Expanded
        const None = vscode.TreeItemCollapsibleState.None

        if (element instanceof Project) {
            const avatar = await element.avatar
            return new ProjectViewDataProvider.ViewItem(element.name, avatar, Collapsed, "projectContext")
        }
        else if (element instanceof ProjectViewDataProvider.ItemContainer) {
            const icon = new vscode.ThemeIcon('folder')
            return new ProjectViewDataProvider.ViewItem(element.label, icon, Collapsed, "repositoryContainerContext")
        }
        else if (element instanceof Folder) {
            const icon = new vscode.ThemeIcon('folder')
            return new ProjectViewDataProvider.ViewItem(element.name, icon, Collapsed, "folderContext")
        }
        else if (element instanceof Repository) {
            const icon = element.isDisabled ? new vscode.ThemeIcon('ellipsis') : new vscode.ThemeIcon('code')
            const description = element.isDisabled ? "disabled" : ""
            const collapsable = !element.isDisabled
            return new ProjectViewDataProvider.ViewItem(element.name, icon, Collapsed, "repositoryContext", description)
        }
        else if (element instanceof Repository.Branch) {
            const icon = new vscode.ThemeIcon('git-branch')
            return new ProjectViewDataProvider.ViewItem(element.name, icon, Collapsed, "repositoryBranchContext")
        }
        else if (element instanceof Pipeline) {
            const icon = new vscode.ThemeIcon('rocket')
            const collapsableState = element.builds.length > 0 ? Expanded : None
            return new ProjectViewDataProvider.ViewItem(element.name, icon, collapsableState, "pipelineContext")
        }
        else if (element instanceof Pipeline.Build) {
            const icon = new vscode.ThemeIcon('sync~spin')
            return new ProjectViewDataProvider.ViewItem(element.sourceBranch, icon, None, "buildContext")
        }
    }

    async getChildren(element) {

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

        if (null == element) {
            return Object.values(await Project.all).filter(val => val.showUser)
        }
        else if (element instanceof ProjectViewDataProvider.ItemContainer) {
            return element.items instanceof Promise ? await element.items : element.items
        }
        else if (element instanceof Project) {
            return [
                new ProjectViewDataProvider.ItemContainer('Pipelines', element.pipelines.then(
                    pipelines => Folder.group(pipelines, pipeline => pipeline.folder).all
                )),
                new ProjectViewDataProvider.ItemContainer('Repositories', element.repositories.then(groupElements))
            ]
        }
        else if (element instanceof Folder) {
            return element.all
        }
        else if (element instanceof Repository) {
            return await element.branches.then(groupElements)
        }
        else if (element instanceof Pipeline) {
            return element.builds
        }
        else return null
    }

    refresh() {
        // fire event from onDidChangeTreeData Event Emitter.
        this.#onDidChangeTreeData.fire()
    }
}


module.exports = ProjectViewDataProvider