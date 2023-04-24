const fs = require('fs')
const vscode = require('vscode')
const devops = require('./api')
const cache = require('./cache.js')
const Repository = require('./repository')
const Pipeline = require('./pipeline')


class Team {

    static async getFromProject(project, refresh = false) {

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
        const avatarfilePath = `${__dirname}\\temp\\avatar.${organization}.${teamid}.png`

        if (fs.existsSync(avatarfilePath)) {
            return avatarfilePath
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

        fs.writeFile(avatarfilePath, base64Avatar.value, 'base64', err => console.log(err))
        return avatarfilePath

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

    static #Organization = null
    static #Map = {}

    static get all() {
        return this.#getProjects()
    }

    static async enable(projectNames) {
        for (const name of Object.keys(await this.all)) {
            Project.#Map[name].showUser = projectNames.includes(name)
        }
        await cache.set('projects', 'enabled', projectNames, null)
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
            let enabled = await cache.get('projects', 'enabled').then(result => result ?? [])
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
                .forEach(data => new Project(data))
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
    constructor(data) {

        this.showUser = data.showUser

        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.description = data.description
        this.visibility = data.visibility
        this.defaultTeam = data.defaultTeam

        const home = require("os").homedir()
        this.path = `${home}\\git\\repos\\__${Project.#Organization.toUpperCase()}\\${data.name}`
        if (!(fs.existsSync(this.path))) {
            fs.mkdirSync(this.path)
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
            this.#resources[constructor.name] = await constructor.getFromProject(this, refresh)
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
        await this.getRepositories(true)
        return await this.getRepositoryByName(name)
    }

}


module.exports = Project