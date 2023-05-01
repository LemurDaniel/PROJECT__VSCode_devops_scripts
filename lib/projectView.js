const vscode = require('vscode')
const Project = require('./data/project')
const Repository = require('./data/repository')
const Pipeline = require('./data/pipeline')

const Folder = require('./utils/Folder')

const utility = require('./utils/utility')


class ProjectView {

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

    constructor() { 
        this.disposable = vscode.window.createTreeView('devopsscripts.view.devops-projects', {
            treeDataProvider: this
        })
    }





    async getTreeItem(element) {

        const Collapsed = vscode.TreeItemCollapsibleState.Collapsed
        const Expanded = vscode.TreeItemCollapsibleState.Expanded
        const None = vscode.TreeItemCollapsibleState.None

        if (element instanceof Project) {
            const item = new vscode.TreeItem(element.name, Collapsed)
            item.contextValue = "projectContext"
            item.iconPath = await element.avatar

            return item
        }

        else if (element instanceof Folder) {
            const folderIconDefault = new vscode.ThemeIcon('folder')
            const item = new vscode.TreeItem(element.name, Collapsed)
            item.contextValue = element.properties.contextValue ?? "folderContext"
            item.iconPath = element.properties.icon ?? folderIconDefault

            return item
        }

        else if (element instanceof Repository) {
            const description = element.isDisabled ? "disabled" : ""
            const collapsable = (await element.pullRequests).length > 0 ? Collapsed : None
            const item = new vscode.TreeItem(element.name, collapsable)
            item.contextValue = "repositoryContext"
            item.description = description
            item.iconPath = element.Icon
            item.command = {
                command: "devopsscripts.repository.select",
                title: "Open Folder",
                arguments: [element]
            }

            return item
        }

        else if (element instanceof Repository.Branch) {
            const item = new vscode.TreeItem(element.name, None)
            item.contextValue = "branchContext"
            item.iconPath = element.Icon

            return item
        }

        else if (element instanceof Repository.PullRequest) {
            const item = new vscode.TreeItem(element.title, Collapsed)
            item.contextValue = "pullRequestContext"
            item.iconPath = element.Icon

            return item
            //let source = element.sourceRefName.split('/').at(-1)
            //const label = `${element.sourceRefName.split('/').at(-1)} => ${element.targetRefName.split('/').at(-1)}`
        }

        else if (element instanceof Pipeline) {
            const collapsableState = element.builds.length > 0 ? Expanded : None
            const item = new vscode.TreeItem(element.name, collapsableState)
            item.contextValue = "pipelineContext"
            item.iconPath = element.Icon

            return item
        }

        else if (element instanceof Pipeline.Build) {
            element.onChange = () => this.refresh()
            const label = `${element.id.toString()} - ${element.sourceBranch}`
            const context = element.status != Pipeline.Build.STATUSES.inProgress
                || element.status != Pipeline.Build.STATUSES.notStarted
                || element.status != Pipeline.Build.STATUSES.none ? 'buildActiveContext' : 'buildContext'

            const item = new vscode.TreeItem(label, None)
            item.contextValue = context
            item.iconPath = element.Icon

            return item
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
            const repositories = element.repositories.then(repositories => {
                repositories.map(repo => repo.pullRequests)
                return groupElements(repositories)
            })

            return [
                new Folder('Pipelines', pipelines, {
                    icon: Pipeline.IconDefault,
                    contextValue: 'PipelinesFolderContext',
                    contextItem: element
                }),
                new Folder('Repositories', repositories, {
                    icon: Repository.IconDefault,
                    contextValue: 'RepositoriesFolderContext',
                    contextItem: element
                })
            ]
        }
        else if (element instanceof Folder) {
            // Create full array of Promises, then await all. Folder content might be Promises or not.
            const elements = element.all.map(value => Promise.resolve(value))
            return await Promise.all(elements).then(arr => arr.flat())
        }
        else if (element instanceof Repository) {
            return await element.pullRequests
        }
        else if (element instanceof Repository.PullRequest) {
            return [element.sourceRef, element.targetRef]
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