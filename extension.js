// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const devops = require('./lib/activate.js')
const SecretData = require('./lib/utils/SecretData.js')

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

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
