const devops = require('./api')
const vscode = require('vscode')
const cache = require('./cache.js')

class Repository {

    static get IconDefault() {
        return new vscode.ThemeIcon('code', new vscode.ThemeColor('charts.orange'))
    }

    static async getFromProject(project, refresh = false) {

        let repositoryCache = await cache.get('repositories', project.name)

        if (null == repositoryCache || refresh) {
            repositoryCache = await project.get({
                api: `/_apis/git/repositories?api-version=6.0`,
                domain: 'dev.azure.com'
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




    get Icon() {
        if (this.isDisabled)
            return new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('testing.IconUnset'))
        else
            return new vscode.ThemeIcon('code', new vscode.ThemeColor('charts.orange'))
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




    /*
        #######################################################
        #### Repository Branches
        #######################################################
    */

    static Branch = class Branch {

        static async getFromRepository(repository) {
            const branches = await repository.project.get({
                api: `/_apis/git/repositories/${repository.id}/refs?api-version=7.0`,
                domain: 'dev.azure.com'
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

        get Icon() {
            return new vscode.ThemeIcon('git-branch')
        }

    }

}

module.exports = Repository