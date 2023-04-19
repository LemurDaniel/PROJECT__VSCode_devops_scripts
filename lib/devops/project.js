const devops = require('./api')
const cache = require('./cache.js')


class Project {

    static #Map

    static get all() {
        return this.getProjects()
    }

    static async getByName(name) {
        return (await this.all)[name]
    }

    static async getProjects() {
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

}

module.exports = Project