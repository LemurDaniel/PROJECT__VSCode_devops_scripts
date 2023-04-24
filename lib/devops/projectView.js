const vscode = require('vscode')
const Project = require('./project')
const Repository = require('./repository')
const Pipeline = require('./pipeline')
const Folder = require('../utils/Folder')
const utility = require('../utils/utility')


class ProjectView {

    static ViewItem = class ViewItem extends vscode.TreeItem {

        constructor(label, iconPath, collapsableState, context, description = '') {
            super(label, collapsableState)
            this.description = description
            this.iconPath = iconPath
            this.contextValue = context
        }

    }




    static #instance

    static get instance() {
        if (null == this.#instance) {
            this.#instance = new ProjectView()
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
            return new ProjectView.ViewItem(element.name, avatar, Collapsed, "projectContext")
        }
        else if (element instanceof Folder) {
            const icon = element.properties.icon ?? new vscode.ThemeIcon('folder')
            return new ProjectView.ViewItem(element.name, icon, Collapsed, "folderContext")
        }
        else if (element instanceof Repository) {
            const icon = element.isDisabled ? new vscode.ThemeIcon('ellipsis') : new vscode.ThemeIcon('code')
            const description = element.isDisabled ? "disabled" : ""
            // Disable branches under repositories for now.
            const collapsable = None//element.isDisabled ? Collapsed : None
            return new ProjectView.ViewItem(element.name, icon, collapsable, "repositoryContext", description)
        }
        else if (element instanceof Repository.Branch) {
            const icon = new vscode.ThemeIcon('git-branch')
            return new ProjectView.ViewItem(element.name, icon, None, "repositoryBranchContext")
        }
        else if (element instanceof Pipeline) {
            const icon = new vscode.ThemeIcon('rocket')
            const collapsableState = element.builds.length > 0 ? Expanded : None
            return new ProjectView.ViewItem(element.name, icon, collapsableState, "pipelineContext")
        }
        else if (element instanceof Pipeline.Build) {
            const icon = new vscode.ThemeIcon('sync~spin')
            return new ProjectView.ViewItem(element.sourceBranch, icon, None, "buildContext")
        }
    }

    async getChildren(element) {

        const groupElements = resources => {
            const groupings = utility.groupSimilar(resources, 4, 4, resource => resource.name)
            if (groupings.groupCount == 1 && groupings.ungrouped.length == 0)
                return resources

            return [
                ...Object.entries(groupings.grouped).map(([prefix, resources]) => new Folder(prefix, resources)),
                ...groupings.ungrouped
            ]
        }

        if (null == element) {
            return Object.values(await Project.all).filter(val => val.showUser)
        }
        else if (element instanceof Project) {

            const pipelines = element.pipelines.then(
                pipelines => Folder.group(pipelines, pipeline => pipeline.folder).all
            )
            return [
                new Folder('Pipelines', pipelines, {
                    icon: new vscode.ThemeIcon('rocket')
                }),
                new Folder('Repositories', element.repositories.then(groupElements), {
                    icon: new vscode.ThemeIcon('code')
                })
            ]
        }
        else if (element instanceof Folder) {
            // Create full array of Promises, then await all. Folder content might be Promises or not.
            const elements = element.all.map(value => Promise.resolve(value))
            return await Promise.all(elements).then(arr => arr.flat())
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


module.exports = ProjectView