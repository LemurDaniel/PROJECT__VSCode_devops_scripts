const vscode = require('vscode')

class Output {

    static #instance

    static get instance () {
    
        if(null == Output.#instance) {
            Output.#instance = new Output()
        }
        return Output.#instance

    }


    constructor() {
        this.output = vscode.window.createOutputChannel('DevOps Scripts')
    }

    appendLine(content) {
        this.output.appendLine(content)
    }

}

module.exports = Output.instance