const devops = require('./api')
const cache = require('./cache.js')


class Pipeline {

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
            await cache.set('pipelines', project.name, pipelineCache)
        }

        return pipelineCache.map(data => new Pipeline(data, project))

    }






    constructor(data, project) {

        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.folder = data.folder
        this.revision = data.revision
        this._links = data._links

        this.project = project

    }





}

module.exports = Pipeline