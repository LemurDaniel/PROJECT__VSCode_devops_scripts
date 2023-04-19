const utility = require('../utils/utility')
const vscode = require('vscode');
const devops = require('./api')
const project = require('./project')
const url = require('url')
const fs = require('fs')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate() {

    vscode.commands.registerCommand("devops.setPat", async () => devops.user_request_token())

    vscode.commands.registerCommand("devops.test", async () => {

        let test
        try {
            test = await devops.post({
                project: 'DC ACF Redeployment',
                scope: 'PROJ',
                api: '/_apis/git/repositories?api-version=7.0',
                body: {
                    name: "new-test-repository"
                }
            })
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })

    vscode.commands.registerCommand("devops.test2", async () => {

        let quickPick_items = Object.values(await project.all)
            .map(project => ({
                label: project.name,
                description: project.description
            }));

        let result = await vscode.window.showQuickPick(
            quickPick_items, {
            canPickMany: false,

        });
        if (null == result) {
            return await vscode.window.showErrorMessage('No Project chosen!');
        }

        let test
        try {
            test = await project.getByName(result.label)
            quickPick_items = test.repositories
                .map(repositories => ({
                    label: repositories.name,
                    description: repositories.description
                }));

            result = await vscode.window.showQuickPick(
                quickPick_items, {
                canPickMany: false,

            });

            if (null == result) {
                return await vscode.window.showErrorMessage('No Repository chosen!');
            }
            test = test.getRepositoryByName(result.label)
            if (!fs.existsSync(test.localpath)) {
                await utility.execute('git', [
                    "-C", test.localpath,
                    "clone", test.remoteUrl, "."
                ])
            }

            result = await vscode.window.showWarningMessage("Open Repository Window", "New", "Current")
            const uri = vscode.Uri.file(test.localpath)
            await vscode.commands.executeCommand('vscode.openFolder', uri, {
                forceNewWindow: (result == 'New'),
                noRecentEntry: true
            });


        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        await vscode.window.showInformationMessage(test);
        //await vscode.window.showInformationMessage(JSON.stringify(test));
    })

}

module.exports = {
    activate
}
