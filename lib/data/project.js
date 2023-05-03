const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const output = require('../output')
const devops = require('./api')
const cache = require('./cache.js')
const Repository = require('./repository')
const Pipeline = require('./pipeline')


class Team {

    static async fromProject(project, refresh = false) {

        let teamsCache = await cache.get('teams', project.name)

        if (null == teamsCache || refresh) {
            teamsCache = await devops.get({
                api: `/_apis/projects/${this.id}/teams?mine={true}&api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'organization'
            })
            teamsCache = teamsCache.value
            await cache.set('teams', project.name, teamsCache)
        }

        return teamsCache.map(data => new Team(data, project))

    }

    static async downloadAvatarFor(teamid) {

        const user = await devops.User.current
        const organization = user.organization.current.accountName
        const avatarFolder = path.join(Project.customPath ?? Project.defaultPath, organization.toUpperCase(), '.temp')
        const avatarFile = `avatar.${organization}.${teamid}.png`
        const avatarFilePath = path.join(avatarFolder, avatarFile)

        if (fs.existsSync(avatarFilePath)) {
            return avatarFilePath
        }
        else if (!fs.existsSync(avatarFolder)) {
            fs.mkdirSync(avatarFolder, {
                recursive: true
            })
        }

        const defaultTeamDescriptor = await devops.get({
            api: `/_apis/graph/descriptors/${teamid}?api-version=5.0-preview.1`,
            domain: 'vssps.dev.azure.com',
            scope: 'organization'
        })

        const base64Avatar = await devops.get({
            api: `/_apis/graph/Subjects/${defaultTeamDescriptor.value}/avatars?api-version=7.0`,
            domain: 'vssps.dev.azure.com',
            scope: 'organization',
            query: {
                format: 'base64'
            }
        })

        fs.writeFileSync(avatarFilePath, base64Avatar.value, 'base64', err => console.log(err))
        return avatarFilePath

    }




    get avatar() {
        return Team.downloadAvatarFor(this.id)
    }

    constructor(data, project) {

        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.description = data.description
        this.identityUrl = data.identityUrl
        this.description = data.description

        this.project = project
    }


}


class Project {

    static #customPath = null
    static get customPath() {
        return Project.#customPath
    }
    static get defaultPath() {
        project
        return path.join(require("os").homedir(), "\\git\\repos\\")
    }
    static set customPath(value) {

        output.appendLine(`Set project path to '${value}'`)

        if (null != value && value.length > 0) {

            value = value.replace('{{HOME_DIR}}', require("os").homedir())

            if (fs.existsSync(value)) {
                output.appendLine(`Found project path '${value}'`)
            }
            else {
                output.appendLine(`Creating project path '${value}'`)
                fs.mkdirSync(value, {
                    recursive: true
                })
            }

        }

        this.#customPath = value
    }


    static #Organization = null
    static #Map = {}

    static get all() {
        return this.#getProjects()
    }

    static async enable(projectNames) {
        for (const name of Object.keys(await this.all)) {
            Project.#Map[name].showUser = projectNames.includes(name)
        }
        const configuration = vscode.workspace.getConfiguration('devops')
        await configuration.update('projects.enabled', {
            ...configuration.get('projects.enabled'),
            [Project.#Organization]: projectNames
        }, true)
    }

    static async getByName(name) {
        return (await Project.all)[name]
    }

    static async #getProjects() {
        const currentOrganization = (await devops.User.current).currentOrganization
        if (null == this.#Organization || currentOrganization != this.#Organization) {
            this.#Organization = currentOrganization
            this.#Map = {}
        }

        if (Object.keys(Project.#Map).length == 0) {

            let projects = await cache.get('projects', 'all')
            let enabled = vscode.workspace.getConfiguration('devops').get('projects.enabled')[currentOrganization] ?? []
            if (null == projects) {
                const response = await devops.get({
                    domain: 'dev.azure.com',
                    scope: 'organization',
                    api: '_apis/projects?api-version=7.0-preview.1' // 7.0-preview.1 includes default team.
                })
                projects = response.value
                    .sort((a, b) => {
                        if (a.name < b.name) return -1
                        else if (a.name > b.name) return 1
                        else return 0
                    })
                await cache.set('projects', 'all', projects)
            }
            projects
                .map(data => ({
                    ...data,
                    showUser: enabled.length == 0 || enabled.includes(data.name)
                }))
                .forEach(data => new Project(data, currentOrganization))
        }

        return Project.#Map

    }






    get repositories() {
        return this.getResources(Repository)
    }
    get pipelines() {
        return this.getResources(Pipeline)
    }
    get teams() {
        return this.getResources(Team)
    }
    get avatar() {
        return Team.downloadAvatarFor(this.defaultTeam.id)
    }

    #resources
    constructor(data, organization) {

        this.showUser = data.showUser

        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.description = data.description
        this.visibility = data.visibility
        this.defaultTeam = data.defaultTeam
        this.organization = organization

        const projectBasePath = Project.customPath ?? Project.defaultPath
        this.path = path.join(projectBasePath, organization.toUpperCase(), data.name)
        if(!fs.existsSync(this.path)) {
            fs.mkdir(this.path, {
                recursive: true
            }, () => null)
        }

        this.#resources = {}
        Project.#Map[data.name] = this
    }

    #rest(request, method = devops.rest) {
        request = typeof request === 'string' ? { api: request } : request
        return method({
            ...request,
            domain: 'dev.azure.com',
            scope: null,
            project: this.id
        })
    }
    get(request) {
        return this.#rest(request, devops.get.bind(devops))
    }
    post(request) {
        return this.#rest(request, devops.post.bind(devops))
    }
    patch(request) {
        return this.#rest(request, devops.patch.bind(devops))
    }
    put(request) {
        return this.#rest(request, devops.put.bind(devops))
    }

    async getRepositoryByName(name) {
        return (await this.repositories).filter(repository => repository.name == name)[0]
    }

    async getRepositoryById(id) {
        return (await this.repositories).filter(repository => repository.id == id)[0]
    }

    async getResources(constructor, refresh = false) {

        if (refresh || null == this.#resources[constructor.name]) {
            this.#resources[constructor.name] = await constructor.fromProject(this, refresh)
        }

        return this.#resources[constructor.name]
    }

    async createRepository(name) {

        if (null == name || name.length <= 0)
            throw new Error("Not a valid Repository Name")

        await this.post({
            api: '/_apis/git/repositories?api-version=7.0',
            body: {
                name: name
            }
        })

        // refetch repositories to cache newly created.
        await this.getResources(Repository, true)
        return await this.getRepositoryByName(name)
    }

}


module.exports = Project