const devops = require('./api')

class Repository {


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
                project: repository.project.id,
                organization: 'baugruppe'
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