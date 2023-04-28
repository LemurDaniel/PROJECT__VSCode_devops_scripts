// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const devops = require('./lib/activate.js')
const output = require('./lib/output')
const SecretData = require('./lib/utils/SecretData.js')


const RepositoryView = require('./lib/repositoryView')
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	SecretData.init(context)
	devops.activate(context)

}

// This method is called when your extension is deactivated
function deactivate() {
	context.subscriptions.forEach(disposable => disposable.dispose());
}

module.exports = {
	activate,
	deactivate
}
