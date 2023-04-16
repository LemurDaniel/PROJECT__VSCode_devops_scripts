const vscode = require('vscode');
const github = require('./api')

const SecretData = require('../utils/SecretData')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate() {

    vscode.commands.registerCommand("github.setToken", async () => github.user_request_token())

    vscode.commands.registerCommand("github.getToken", async () => {
        let test
        try {
            test = await github.rest('get', '/user')
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        console.log(test)
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })

}

module.exports = {
    activate
}
