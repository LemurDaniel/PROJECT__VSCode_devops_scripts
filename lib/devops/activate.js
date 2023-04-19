const vscode = require('vscode');
const devops = require('./api')
const project = require('./project')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate() {

    vscode.commands.registerCommand("devops.setPat", async () => devops.user_request_token())

    vscode.commands.registerCommand("devops.test", async () => {

        let test
        try {
            test = await project.all
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })

    vscode.commands.registerCommand("devops.test2", async () => {

        let name = await vscode.window.showInputBox()
        let test
        try {
            test = await project.getByName(name)
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })

}

module.exports = {
    activate
}
