const vscode = require('vscode')
const interaction = require('../utils/interaction')


const ProjectView = require('../projectView')
const Pipeline = require('../data/pipeline')
const Repository = require('../data/repository')
const Project = require('../data/Project')
const Folder = require('../utils/Folder')


async function command(context) {

    try {

        if (context instanceof Folder) {

            if (context.properties.contextValue == 'PipelinesFolderContext') {
                context.properties.contextItem.getResources(Pipeline, true)
            }
            else if (context.properties.contextValue == 'RepositoriesFolderContext') {
                context.properties.contextItem.getResources(Repository, true)
            }

            ProjectView.instance.refresh()

        } 
        
        else if(context instanceof Pipeline) {
            context.refresh()
            ProjectView.instance.refresh()
        }

        else if(context instanceof Repository) {
            context.getResources(Repository.PullRequest, true)
            ProjectView.instance.refresh()
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = vscode.commands.registerCommand("devopsscripts.resource.refresh", command)