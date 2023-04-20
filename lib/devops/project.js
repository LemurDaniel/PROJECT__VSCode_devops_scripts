const fs = require('fs')
const devops = require('./api')
const cache = require('./cache.js')
const vscode = require('vscode')

class Project {

    static #Map
    static #Instances = {}

    static get all() {
        return this.#getProjects()
    }

    static async enable(projectsMap) {
        for (const name of Object.keys(await this.all)) {
            Project.#Map[name].showUser = name in projectsMap
        }
        cache.set('projects', 'all', this.#Map)
    }

    static async #getProjects() {
        if (null == Project.#Map) {

            let projects = cache.get('projects', 'all')
            if (null == projects) {
                const response = await devops.get({
                    domain: 'dev.azure.com',
                    scope: 'org',
                    project: 'DC Azure Migration',
                    organization: 'baugruppe',
                    api: '_apis/projects?api-version=6.0'
                })
                projects = response.value
                    .sort((a, b) => {
                        if (a.name > b.name) return -1
                        else if (a.name < b.name) return 1
                        else return 0
                    })
                    .map(project => ({
                        [project.name]: {
                            showUser: true,
                            isProject: true,
                            ...project
                        }
                    }))
                    .reduce((acc, project) => ({ ...project, ...acc }), {})
                cache.set('projects', 'all', projects)
            }
            Project.#Map = projects

        }
        return Project.#Map
    }


    static async getByName(name, refresh = false) {

        if (!refresh && (name in Project.#Instances)) {
            return Project.#Instances[name]
        }

        const temp = (await Project.all)[name]

        const project = new Project()
        project.id = temp.id
        project.url = temp.url
        project.name = temp.name
        project.description = temp.description
        project.visibility = temp.visibility

        const home = require("os").homedir()
        project.path = `${home}\\git\\repos\\__BAUGRUPPE\\${project.name}`
        if (!(fs.existsSync(project.path))) {
            fs.mkdirSync(project.path)
        }

        const projectCache = cache.get('projects', project.name)
        if (null == projectCache || refresh) {
            const repositories = await devops.get({
                api: `/_apis/git/repositories?api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: project.id,
                organization: 'baugruppe'
            })
            project.repositories = repositories.value
                .map(repository => ({
                    localpath: `${project.path}\\${repository.name}`,
                    projectpath: project.path,
                    ...repository
                }))
                .sort((a, b) => {
                    if (a.name < b.name) return -1
                    else if (a.name > b.name) return 1
                    else return 0
                })

            const teams = await devops.get({
                api: `/_apis/projects/${project.id}/teams?mine={true}&api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'org',
                organization: 'baugruppe'
            })
            project.teams = teams.value
            cache.set('projects', project.name, project)
        } else {
            project.repositories = projectCache.repositories
            project.teams = projectCache.teams
        }

        Project.#Instances[name] = project
        return project
    }

    Project() {
        this.id = null
        this.url = null
        this.path = null
        this.name = null
        this.description = null
        this.visibility = null

        this.repositories = null
        this.teams = null
    }

    getRepositoryByName(name) {
        return this.repositories
            .filter(repository => repository.name == name)[0]
    }

}


module.exports = Project