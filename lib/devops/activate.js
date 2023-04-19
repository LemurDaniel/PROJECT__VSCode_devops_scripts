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
        } catch (err) {
            await vscode.window.showErrorMessage(JSON.stringify(err));
        }
        await vscode.window.showInformationMessage(JSON.stringify(test));
    })

}

module.exports = {
    activate
}
