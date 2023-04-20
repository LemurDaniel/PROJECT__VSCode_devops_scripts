const fs = require('fs')
const devops = require('./api')
const cache = require('./cache.js')
const vscode = require('vscode')

class Project {

    static #Map = {}

    static get all() {
        return this.#getProjects()
    }

    static async enable(projectsMap) {
        for (const name of Object.keys(await this.all)) {
            Project.#Map[name].showUser = name in projectsMap
        }
        cache.set('projects', 'all', this.#Map)
    }

    static async getByName(name) {
        return (await Project.all)[name]
    }

    static async #getProjects() {
        if (Object.keys(Project.#Map).length == 0) {

            let projects = Object.values(cache.get('projects', 'all'))
            if (null == projects) {
                const response = await devops.get({
                    domain: 'dev.azure.com',
                    scope: 'org',
                    organization: 'baugruppe',
                    api: '_apis/projects?api-version=6.0'
                })
                projects = response.value
                    .sort((a, b) => {
                        if (a.name > b.name) return -1
                        else if (a.name < b.name) return 1
                        else return 0
                    })
                    .map(data => ({
                        showUser: true,
                        ...data
                    }))
                cache.set('projects', 'all', projects)
            }
            projects.forEach(data => new Project(data))
        }
        return Project.#Map
    }


    get repositories() {
        return this.getRepositories()
    }
    get teams() {
        return this.getTeams()
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

        const home = require("os").homedir()
        this.path = `${home}\\git\\repos\\__BAUGRUPPE\\${data.name}`
        if (!(fs.existsSync(this.path))) {
            fs.mkdirSync(this.path)
        }

        this.#repositories = null
        this.#teams = null

        Project.#Map[this.name] = this
    }

    async getRepositoryByName(name) {
        return (await this.repositories).filter(repository => repository.name == name)[0]
    }

    async getRepositories(refresh = false) {

        if (!refresh && null != this.#repositories) {
            return this.#repositories
        }

        const repositoriesCache = cache.get('repositories', this.name)
        if (null == repositoriesCache || refresh) {
            const repositories = await devops.get({
                api: `/_apis/git/repositories?api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: this.id,
                organization: 'baugruppe'
            })
            this.#repositories = repositories.value
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
            cache.set('repositories', this.name, repositories)
        }

        return this.repositories
    }

    async getTeams(refresh = false) {

        if (!refresh && null != this.#teams) {
            return this.#teams
        }

        const teamsCache = cache.get('teams', this.name)
        if (null == teamsCache || refresh) {
            const teams = await devops.get({
                api: `/_apis/projects/${this.id}/teams?mine={true}&api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'org',
                organization: 'baugruppe'
            })
            this.#teams = teams.value
            cache.set('teams', this.name, teams)
        }
        return this.#teams
    }


}


module.exports = Project