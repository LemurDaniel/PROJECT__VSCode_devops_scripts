const devops = require('./api')
const cache = require('./cache.js')
const interaction = require('./userinteraction')

class Pipeline {

    static Build = class Build {

        constructor(data, pipeline) {

            this.id = data.id
            this.url = data.url
            this.uri = data.uri
            this._links = data._links
            this.reason = data.reason
            this.priority = data.priority
            this.sourceBranch = data.sourceBranch
            this.status = data.status
            this.pipeline = pipeline

        }
    }




    static async getFromProject(project, refresh = false) {

        let pipelineCache = await cache.get('pipelines', project.name)

        if (null == pipelineCache || refresh) {
            pipelineCache = await devops.get({
                api: `/_apis/pipelines?api-version=7.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: project.id
            })

            pipelineCache = pipelineCache.value
                .sort((a, b) => {
                    if (a.name < b.name) return -1
                    else if (a.name > b.name) return 1
                    else return 0
                })
                .map(data => devops.get({
                    api: `/_apis/pipelines/${data.id}?api-version=7.0`,
                    domain: 'dev.azure.com',
                    scope: 'proj',
                    project: project.id
                }))

            pipelineCache = await Promise.all(pipelineCache)
            await cache.set('pipelines', project.name, pipelineCache)
        }

        return pipelineCache.map(data => new Pipeline(data, project))

    }





    get builds() {
        return this.#builds
    }

    #builds
    constructor(data, project) {

        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.folder = data.folder
        this.revision = data.revision
        this._links = data._links
        this.configuration = data.configuration

        this.project = project
        this.#builds = []
    }

    async #startOnBranch(branch) {

        const build = await devops.post({
            scope: 'proj',
            project: this.project.id,
            api: '/_apis/build/builds?api-version=6.0',
            body: {
                definition: {
                    id: this.id
                },
                sourceBranch: branch.name
            }
        }).then(data => new Pipeline.Build(data, this))

        // TODO remove from here and treeview, once build is finished
        // TODO Periodically update state of builds
        this.#builds.push(build)

        return build
    }

    async start() {

        const branches = await this.project.getRepositoryById(this.configuration.repository.id).then(repo => repo.branches)
        const branch = await interaction.selectSingleFromOptions(branches, branch => ({ label: branch.name }))

        return await this.#startOnBranch(branch)

    }



}

module.exports = Pipeline