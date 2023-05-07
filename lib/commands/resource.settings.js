const vscode = require('vscode')
const interaction = require('../utils/interaction')


const ProjectView = require('../projectView')
const Pipeline = require('../data/pipeline')


async function command(context) {

    try {

        if (context instanceof Pipeline) {

            const queueStatus = await interaction.selectSingleFromOptions(Object.values(Pipeline.QUEUE_STATUS))

            if (context.queueStatus == queueStatus) return

            await context.updateSettings({
                queueStatus: queueStatus
            })

            ProjectView.instance.refresh()

        } else {
            // TODO

        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

module.exports = vscode.commands.registerCommand("devopsscripts.resource.settings", command)