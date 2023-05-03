const vscode = require('vscode')

async function selectFromOptions(options, configuration = {}) {

    let converter = configuration.converter
    delete configuration.converter

    if (null == converter) {
        converter = option => {

            let convertedOption = {
                label: null,
                description: null,
                picked: false
            }
            const labels = ['name', 'label']
            const descriptors = ['description']

            if (option instanceof Object) {
                convertedOption.label = Object.keys(option).filter(key => labels.some(v => key.toLowerCase().includes(v)))[0]
                convertedOption.description = Object.keys(option).filter(key => descriptors.some(v => key.toLowerCase().includes(v)))[0]

                convertedOption.label = option[convertedOption.label]
                convertedOption.description = option[convertedOption.description]
            }
            else if (typeof option === 'string') {
                convertedOption.label = option
            }

            return convertedOption
        }
    }

    options = options instanceof Object ? Object.values(options) : options

    const optionsPoll = await vscode.window.showQuickPick(
        options.map(converter),
        {
            canPickMany: true,
            ...configuration
        }
    )

    if (null == optionsPoll) {
        return await vscode.window.showErrorMessage(`No ${options[0].constructor.name} chosen!`);
    }

    if (optionsPoll instanceof Array) {
        return options.filter(option => optionsPoll.map(value => (value.label ?? value)).includes(converter(option).label))
    } else {
        return options.filter(options => converter(options).label == (optionsPoll.label ?? optionsPoll))[0]
    }

}


async function selectSingleFromOptions(options, configuration) {
    return await selectFromOptions(options, {
        ...configuration,
        canPickMany: false
    })
}


module.exports = {
    selectFromOptions,
    selectSingleFromOptions
}