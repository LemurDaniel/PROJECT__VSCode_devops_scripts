const devops = require('./api')
const cache = require('./cache.js')

class Repository {

    static async getFromProject(project, refresh = false) {

        let repositoryCache = await cache.get('repositories', project.name)

        if (null == repositoryCache || refresh) {
            repositoryCache = await devops.get({
                api: `/_apis/git/repositories?api-version=6.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: project.id
            })
            repositoryCache = repositoryCache.value
                .sort((a, b) => {
                    if (a.name < b.name) return -1
                    else if (a.name > b.name) return 1
                    else return 0
                })
            await cache.set('repositories', project.name, repositoryCache)
        }

        return repositoryCache.map(data => new Repository(data, project))

    }






    get branches() {
        return this.getRepositoryRefs()
    }

    #branches = null
    constructor(data, project) {

        this.id = data.id
        this.name = data.name
        this.url = data.url
        this.project = project
        this.hasbranches = true

        this.defaultBranch = data.defaultBranch
        this.remoteUrl = data.remoteUrl
        this.sshUrl = data.sshUrl
        this.webUrl = data.webUrl

        this.isDisabled = data.isDisabled
        this.isInMaintenance = data.isInMaintenance

        this.localpath = `${project.path}\\${data.name}`
    }


    getRepositoryRefs(refresh = false) {

        if (refresh || null == this.#branches) {
            this.#branches = Repository.Branch.getFromRepository(this)
        }

        return this.#branches
    }



    static Branch = class Branch {

        static async getFromRepository(repository) {
            const branches = await devops.get({
                api: `/_apis/git/repositories/${repository.id}/refs?api-version=7.0`,
                domain: 'dev.azure.com',
                scope: 'proj',
                project: repository.project.id
            })

            return branches.value.map(data => new Repository.Branch(data, repository))
        }

        constructor(data, repository) {

            this.name = data.name
            this.objectId = data.objectId
            this.creator = data.creator
            this.url = data.url
            this.repository = repository

        }
    }

}

module.exports = Repository