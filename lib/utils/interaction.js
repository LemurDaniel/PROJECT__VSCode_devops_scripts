const vscode = require('vscode')

async function selectFromOptions(options, converter = null, canPickMany = true) {

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
                convertedOption.label = labels.map(val => option[val])[0]
                convertedOption.description = descriptors.map(val => option[val])[0]
            }
            else if (typeof option === 'string') {
                convertedOption.label = option
            }

            return convertedOption
        }
    }

    const optionsPoll = await vscode.window.showQuickPick(
        options.map(converter),
        {
            canPickMany: canPickMany,
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


async function selectSingleFromOptions(options, converter) {
    return await selectFromOptions(options, converter, false)
}











async function userPickOrganization() {

    const user = await devops.User.current
    const quickPick_Organizations = user.organization.all
        .map(organization => ({
            label: organization.accountName,
            description: organization.accountUri
        }))

    const organizationPoll = await vscode.window.showQuickPick(quickPick_Organizations, {
        canPickMany: false,
    })

    if (null == organizationPoll)
        throw new Error("No Organization chosen!")

    return user.organization.all.filter(organization => organization.accountName == organizationPoll.label)[0]

}


async function userPickProject() {
    const quickPick_projects = Object.values(await Project.all)
        .filter(project => project.showUser)
        .map(project => ({
            label: project.name,
            description: project.description
        }))

    const projectPoll = await vscode.window.showQuickPick(quickPick_projects, {
        canPickMany: false,
    })

    if (null == projectPoll) {
        await vscode.window.showErrorMessage('No Project chosen!')
        throw "No Project chosen!"
    } else {
        return await Project.getByName(projectPoll.label)
    }
}

async function userPickRepositoryByProject() {

    try {
        const project = await userPickProject()
        const quickPick_repositories = (await project.repositories)
            .map(repository => ({
                label: repository.name,
                description: repository.description
            }));

        const repositoryPoll = await vscode.window.showQuickPick(quickPick_repositories, {
            canPickMany: false,
        });

        if (null == repositoryPoll) {
            return await vscode.window.showErrorMessage('No Repository chosen!');
        }

        return await project.getRepositoryByName(repositoryPoll.label)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}

// Testing
async function userPickTeamByProject() {

    try {
        const project = await userPickProject()
        const quickPick_teams = (await project.teams)
            .map(team => ({
                label: team.name,
                description: team.description
            }));

        const teamPoll = await vscode.window.showQuickPick(quickPick_teams, {
            canPickMany: false,
        });

        if (null == teamPoll) {
            return await vscode.window.showErrorMessage('No Team chosen!');
        }

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}



module.exports = {
    selectFromOptions,
    selectSingleFromOptions
}