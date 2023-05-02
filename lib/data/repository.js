const utility = require('../utils/utility')
const devops = require('./api')
const vscode = require('vscode')
const cache = require('./cache.js')
const fs = require('fs')

class Repository {

    static #instances = {}

    static get IconDefault() {
        return new vscode.ThemeIcon('code', new vscode.ThemeColor('charts.orange'))
    }

    static async fromProject(project, refresh = false) {

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

        return repositoryCache.map(data => {
            if (data.id in Repository.#instances)
                return Repository.#instances[data.id].refresh(data)
            else {
                const repository = new Repository(data, project)
                Repository.#instances[data.id] = repository
                return repository
            }
        })

    }




    get Icon() {
        if (this.isDisabled)
            return new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('testing.IconUnset'))
        else if (this.isDownloadedLocaly)
            return new vscode.ThemeIcon('code', new vscode.ThemeColor('charts.orange'))
        else
            return new vscode.ThemeIcon('code')
    }

    get branches() {
        return this.isDisabled ? Promise.resolve([]) : this.getResources(Repository.Branch)
    }

    get status() {
        if (!this.isDownloadedLocaly)
            return Promise.resolve([])

        return utility.execute(`git status --porcelain`, this.localpath)
            .then(result => result.split('\n'))
    }

    // Get local branches of repository
    get branchesLocal() {

        if (!this.isDownloadedLocaly)
            return Promise.resolve([])

        return utility.execute(`git branch --list --format=%(refname);%(refname:short);%(authorname)`, this.localpath)
            .then(result =>
                result.split('\n').filter(name => name.length > 0)
                    .map(data => data.split(';'))
                    .map(data => ({
                        name: data[0],
                        nameShort: data[1],
                        creator: data[2]
                    }))
                    .map(data =>
                        new Repository.Branch(data, Repository.Branch.LOCAL, this)
                    )
            )


    }

    // Get local branches of repository
    get currentBranchLocal() {

        if (!this.isDownloadedLocaly)
            return Promise.resolve('')

        return utility.execute(`git branch --list --format=%(if)%(HEAD)%(then)*%(end)%(refname);%(refname:short);%(authorname)`, this.localpath)
            .then(result => result.split('\n').filter(line => line[0] == '*').at(0))
            .then(result => result.substring(1).split(';'))
            .then(data => ({
                name: data[0],
                nameShort: data[1],
                creator: data[2]
            }))
            .then(data =>
                new Repository.Branch(data, Repository.Branch.LOCAL, this)
            )
    }

    async setCurrentBranchLocal(branch) {

        if (!this.isDownloadedLocaly)
            throw new Error('Not downloaded locally!')

        if (branch instanceof Repository.Branch)
            branch = branch.nameShort

        //2>null since it throws error, even when not failed
        return await utility.execute(`git checkout ${branch} 2>nul`, this.localpath)
    }

    get pullRequests() {
        return this.isDisabled ? Promise.resolve([]) : this.getResources(Repository.PullRequest)
    }

    get isDownloadedLocaly() {
        return fs.existsSync(this.localpath)
    }

    #branches = null
    #resources = {}
    constructor(data, project) {
        this.project = project
        this.refresh(data)
    }

    refresh(data) {
        this.id = data.id
        this.name = data.name
        this.url = data.url
        this.hasbranches = true

        this.defaultBranch = data.defaultBranch
        this.remoteUrl = data.remoteUrl
        this.sshUrl = data.sshUrl
        this.webUrl = data.webUrl

        this.isDisabled = data.isDisabled
        this.isInMaintenance = data.isInMaintenance

        this.localpath = `${this.project.path}\\${data.name}`

        return this
    }

    async getResources(constructor, refresh = false) {

        if (refresh || null == this.#resources[constructor.name] || Date.now() > this.#resources[constructor.name].expires) {
            this.#resources[constructor.name] = {
                content: await constructor.fromRepository(this),
                expires: Date.now() + 1000 * 90
            }
        }

        return this.#resources[constructor.name].content
    }

    async createPullRequest(sourceBranch, targetBranch) {

        const pullRequest = Repository.PullRequest.create(sourceBranch, targetBranch, this)

        // Refetch pullrequests 
        await this.getResources(Repository.PullRequest, true)

        return pullRequest
    }


    /*
        #######################################################
        #### Repository Branches
        #######################################################
    */

    static Branch = class Branch {

        static LOCAL = 'local'
        static REMOTE = 'remote'


        static async fromRepository(repository) {
            const branches = await repository.project.get({
                api: `/_apis/git/repositories/${repository.id}/refs?api-version=7.0`,
                query: {
                    filter: 'heads'
                }
            })

            return branches.value.map(
                data => new Repository.Branch(data, Repository.Branch.REMOTE, repository)
            )
        }




        get Icon() {
            return new vscode.ThemeIcon('git-branch')
        }

        constructor(data, type, repository) {

            this.type = type

            this.url = data.url
            this.objectId = data.objectId

            this.name = data.name
            this.nameShort = data.nameShort ?? data.name.replace('refs/heads/', '')
            this.creator = data.creator
            this.repository = repository

        }

        async pushRemote() {
            return await utility.execute(`git push --set-upstream origin ${this.nameShort}:${this.nameShort}`, this.repository.localpath)
        }

        async pullRemote(sourceBranch) {
            return await utility.execute(`git pull origin ${this.nameShort}:${sourceBranch?.nameShort ?? this.nameShort}`, this.repository.localpath)
        }

    }


    /*
        #######################################################
        #### Repository Pull Requests
        #######################################################
    */

    static PullRequest = class PullRequest {

        static async fromRepository(repository) {
            const pullRequests = await repository.project.get({
                api: `/_apis/git/repositories/${repository.id}/pullrequests?api-version=7.0`,
                query: {
                    'searchCriteria.status': 'active'
                }
            })

            const branches = await repository.branches
            return pullRequests.value.map(data => new Repository.PullRequest(data, repository, branches))
        }

        static async create(sourceBranch, targetBranch, repository) {

            require('../output').appendLine(`${sourceBranch.name} - ${sourceBranch.type} ${sourceBranch.type == Repository.Branch.local}`)
            if (sourceBranch.type == Repository.Branch.LOCAL)
                sourceBranch.pushRemote()

            if (targetBranch.type == Repository.Branch.LOCAL)
                targetBranch.pushRemote()

            return new Repository.PullRequest()
        }



        get Icon() {
            return new vscode.ThemeIcon('git-pull-request')
        }

        constructor(data, repository, branches) {

            this.pullRequestId = data.pullRequestId
            this.description = data.description
            this.title = data.title
            this.url = data.url

            this.sourceRefName = data.sourceRefName
            this.targetRefName = data.targetRefName

            this.sourceRef = branches.filter(branch => branch.name == data.sourceRefName)[0]
            this.targetRef = branches.filter(branch => branch.name == data.targetRefName)[0]

            this.mergeStatus = data.mergeStatus

            this.webUrl = `https://dev.azure.com/${repository.project.organization}/${repository.project.id}/_git/${repository.id}/pullrequest/${data.pullRequestId}`

            this.repository = repository

        }

    }

}

module.exports = Repository