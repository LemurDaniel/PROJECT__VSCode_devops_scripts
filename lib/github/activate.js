const vscode = require('vscode');
const github = require('./api')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    let disposable = vscode.commands.registerCommand("github.setToken", async () => github.user_request_token())
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand("github.getToken", async () => {
        let test
        try {
            test = await github.rest('get', '/user')
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        console.log(test)
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })
    context.subscriptions.push(disposable)

}

module.exports = {
    activate
}
