const fs = require('fs')
const devops = require('./api')
const cache = require('./cache.js')


class Project {

    static #Map
    static #Instances = {}

    static get all() {
        return this.#getProjects()
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
                    .map(project => ({ [project.name]: project }))
                    .reduce((acc, project) => ({ ...project, ...acc }), {})
                cache.set('projects', 'all', projects)
            }
            Project.#Map = projects

        }
        return Project.#Map
    }


    static async getByName(name) {

        if (name in Project.#Instances) {
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
        project.path = `${home}\\${project.name}`
        if (!(fs.existsSync(project.path))) {
            fs.mkdirSync(project.path)
        }

        const projectCache = cache.get('projects', project.name)
        if (null == projectCache) {
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
                    ...repository
                }))

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