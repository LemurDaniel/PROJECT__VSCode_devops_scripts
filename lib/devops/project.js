const fs = require('fs')
const devops = require('./api')
const cache = require('./cache.js')
const vscode = require('vscode')
const Repository = require('./repository')

class Project {

    static #Organization = null
    static #Map = {}

    static get all() {
        return this.#getProjects()
    }

    static async enable(projectsMap) {
        for (const name of Object.keys(await this.all)) {
            Project.#Map[name].showUser = name in projectsMap
        }
        await cache.set('projects', 'enabled', projectsMap, null)
    }

    static async getByName(name) {
        return (await Project.all)[name]
    }

    static async #getProjects() {

        const currentOrganization = (await devops.User.current).organization.current.accountName
        if (null == this.#Organization || currentOrganization != this.#Organization) {
            this.#Organization = currentOrganization
            this.#Map = {}
        }

        if (Object.keys(Project.#Map).length == 0) {

            let projects = await cache.get('projects', 'all')
            let enabled = await cache.get('projects', 'enabled').then(result => result ?? {})
            if (null == projects) {
                const response = await devops.get({
                    domain: 'dev.azure.com',
                    scope: 'org',
                    api: '_apis/projects?api-version=7.0-preview.1' // 7.0-preview.1 includes default team.
                })
                projects = response.value
                    .sort((a, b) => {
                        if (a.name < b.name) return -1
                        else if (a.name > b.name) return 1
                        else return 0
                    })
                    .map(data => ({
                        showUser: data.name in enabled,
                        ...data
                    }))
                await cache.set('projects', 'all', projects)
            }
            projects.forEach(data => Project.#Map[data.name] = new Project(data))
        }
        return Project.#Map
    }





    get repositories() {
        return this.getRepositories()
    }
    get teams() {
        return this.getTeams()
    }

    get avatar() {
        return this.#downloadAvatar()
    }

    #repositories
    #teams
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

        this.#repositories = null
        this.#teams = null
    }





    async getRepositoryByName(name) {
        return (await this.repositories).filter(repository => repository.name == name)[0]
    }

    async getRepositories(refresh = false) {

        if (!refresh && null != this.#repositories) {
            return this.#repositories
        }

        let repositoryCache = await cache.get('repositories', this.name)
        if (null == repositoryCache || refresh) {
            repositoryCache = await devops.get({
                api: `/_apis/git/repositories?api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: this.id
            })
            repositoryCache = repositoryCache.value
                .map(repository => ({
                    localpath: `${this.path}\\${repository.name}`,
                    projectpath: this.path,
                    ...repository
                }))
                .sort((a, b) => {
                    if (a.name < b.name) return -1
                    else if (a.name > b.name) return 1
                    else return 0
                })
            await cache.set('repositories', this.name, repositoryCache)
        }

        this.#repositories = repositoryCache.map(data => new Repository(data, this))
        return this.#repositories
    }

    async getTeams(refresh = false) {

        if (!refresh && null != this.#teams) {
            return this.#teams
        }

        this.#teams = await cache.get('teams', this.name)
        if (null == this.#teams || refresh) {
            const teams = await devops.get({
                api: `/_apis/projects/${this.id}/teams?mine={true}&api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'org'
            })
            this.#teams = teams.value
            await cache.set('teams', this.name, this.#teams)
        }
        return this.#teams
    }

    async #downloadAvatar() {

        const user = await devops.User.current
        const organization = user.organization.current.accountName
        const avatarfilePath = `${__dirname}\\temp\\avatar.${organization}.${this.name}.png`

        if (fs.existsSync(avatarfilePath)) {
            return avatarfilePath
        }

        const defaultTeamDescriptor = await devops.get({
            api: `/_apis/graph/descriptors/${this.defaultTeam.id}?api-version=5.0-preview.1`,
            domain: 'vssps.dev.azure.com',
            scope: 'org'
        })

        const base64Avatar = await devops.get({
            api: `/_apis/graph/Subjects/${defaultTeamDescriptor.value}/avatars?api-version=7.0`,
            domain: 'vssps.dev.azure.com',
            scope: 'org',
            query: {
                format: 'base64'
            }
        })

        vscode.window.showInformationMessage(avatarfilePath)

        fs.writeFile(avatarfilePath, base64Avatar.value, 'base64', err => vscode.window.showErrorMessage(err))
        return avatarfilePath
    }


    async createRepository(name) {

        if (null == name || name.length <= 0)
            throw new Error("Not a valid Repository Name")

        await devops.post({
            project: this.id,
            scope: 'PROJ',
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