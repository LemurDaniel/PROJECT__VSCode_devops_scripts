const vscode = require('vscode')
const output = require('../output')
const interaction = require('../utils/interaction')


const ProjectView = require('../projectView')
const Pipeline = require('../data/pipeline')


const commandName = __filename.split(/[/\\]+/).at(-1).replace('.js', '')
async function command(context) {

    output.appendLine(`Invoked command '${commandName}' with '${context?.constructor?.name}'`)
    if (null == context) return


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


module.exports = vscode.commands.registerCommand(`devopsscripts.${commandName}`, command)