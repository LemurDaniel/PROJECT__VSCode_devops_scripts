const vscode = require('vscode')
const devops = require('./api')
const Project = require('./project')

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


async function userSelectProjects() {

    const projects = await Project.all
    const quickPick_projects = Object.values(projects)
        .sort((a,b) => {
               if(a.showUser == b.showUser) return 0
               else if(a.showUser == true) return -1
               else return 1
        })
        .map(project => ({
            label: project.name,
            description: project.description,
            picked: project.showUser
        }))

    const projectPoll = await vscode.window.showQuickPick(quickPick_projects, {
        canPickMany: true,
    })

    if (null == projectPoll) {
        return await vscode.window.showErrorMessage('No Projects chosen!');
    }

    return projectPoll
        .map(result => ({ [result.label]: projects[result.label] }))
        .reduce((acc, project) => ({ ...project, ...acc }))

}



module.exports = {
    userPickTeamByProject,
    userPickRepositoryByProject,
    userSelectProjects,
    userPickOrganization
}