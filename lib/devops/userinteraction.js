const vscode = require('vscode');
const Project = require('./project')


async function userPickRepositoryByProject() {
    const quickPick_projects = Object.values(await Project.all)
        .map(project => ({
            label: project.name,
            description: project.description
        }))

    const projectPoll = await vscode.window.showQuickPick(quickPick_projects, {
        canPickMany: false,
    })

    if (null == projectPoll) {
        return await vscode.window.showErrorMessage('No Project chosen!');
    }

    try {
        const project = await Project.getByName(projectPoll.label)
        const quickPick_repositories = project.repositories
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

        return project.getRepositoryByName(repositoryPoll.label)

    } catch (exception) {
        vscode.window.showErrorMessage(exception.message)
    }

}


module.exports = {
    userPickRepositoryByProject
}