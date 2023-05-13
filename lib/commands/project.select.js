const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')

const ProjectView = require('../projectView')
const Project = require('../data/project')

const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)


    try {

        let projects = Object.values(await Project.all)
            .sort((a, b) => {
                if (a.showUser == b.showUser) return 0
                else if (a.showUser == true) return -1
                else return 1
            })

        projects = await interaction.selectFromOptions(projects, {
            converter: option => ({
                label: option.name,
                description: option.description,
                picked: option.showUser
            })
        })
        if (null == projects) return

        await Project.enable(projects.map(project => project.name))
        ProjectView.instance.refresh()

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }


}


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)