const vscode = require('vscode')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')
const Project = require('../data/project')

async function command(context) {

    try {

        const projects = Object.values(await Project.all)
            .sort((a, b) => {
                if (a.showUser == b.showUser) return 0
                else if (a.showUser == true) return -1
                else return 1
            })

        const projectNames = await interaction.selectFromOptions(projects, option => ({
            label: option.name,
            description: option.description,
            picked: option.showUser
        })).then(projects => projects.map(project => project.name))

        await Project.enable(projectNames)
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }


}

module.exports = vscode.commands.registerCommand("devopsscripts.project.select", command)