const utility = require('../utils/utility')
const devops = require('./api')
const vscode = require('vscode')
const cache = require('./cache.js')
const fs = require('fs')

class Repository {

    static #instances = {}

    static get IconDefault() {
        return new vscode.ThemeIcon('code', new vscode.ThemeColor('devopsscripts.repository'))
    }

    static async from(project, refresh = false) {

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
            await cache.set(repositoryCache, null, 'repositories', project.name)
        }

        return repositoryCache.map(data => {
            if (data.id in Repository.#instances)
                return Repository.#instances[data.id].#refresh(data)
            else {
                const repository = new Repository(data, project)
                Repository.#instances[data.id] = repository
                return repository
            }
        })

    }




    get Icon() {
        if (this.isDisabled)
            return new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('devopsscripts.disabled'))
        else if (this.isDownloadedLocaly)
            return new vscode.ThemeIcon('code', new vscode.ThemeColor('devopsscripts.repository'))
        else
            return new vscode.ThemeIcon('code')
    }

    get branchesRemote() {
        return this.isDisabled ? Promise.resolve([]) : this.getResources(Repository.Branch)
    }

    get status() {
        if (!this.isDownloadedLocaly)
            return Promise.resolve([])

        return utility.execute(`git status --porcelain`, this.localpath)
            .then(result => result.split('\n'))
    }

    // Get local branches of repository
    get branches() {

        if (!this.isDownloadedLocaly)
            return Promise.resolve([])

        return utility.execute(`git --no-pager branch --all --list --format=%(refname);%(refname:short);%(authorname)`, this.localpath)
            .then(result => {
                const branchesData = result.split('\n').filter(name => name.length > 0)
                    .map(data => data.split(';'))
                    .map(data => ({
                        name: data[0],
                        nameShort: data[1],
                        creator: data[2]
                    }))
                    .filter(data => data.name != 'refs/remotes/origin/HEAD')


                const dictionary = {}
                branchesData.filter(data => !data.name.includes('origin'))
                    .forEach(data => dictionary[data.nameShort] = data)

                return branchesData.filter(data =>
                    data.nameShort in dictionary || !(data.name.split('/').at(-1) in dictionary)
                ).map(data =>
                    new Repository.Branch(data, Repository.Branch.LOCAL, this)
                )
            })
    }

    // Get local branches of repository
    get currentBranchLocal() {

        if (!this.isDownloadedLocaly)
            return Promise.resolve('')

        return utility.execute(`git --no-pager branch --list --format=%(if)%(HEAD)%(then)*%(end)%(refname);%(refname:short);%(authorname)`, this.localpath)
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
        //return await utility.execute(`git checkout ${branch} 2>nul`, this.localpath)

        return await utility.execute(`git switch ${branch} 2>nul`, this.localpath)
    }

    get pullRequests() {
        return this.isDisabled ? Promise.resolve([]) : this.getResources(Repository.PullRequest)
    }

    get isDownloadedLocaly() {
        return fs.existsSync(this.localpath)
    }

    #resources = {}
    constructor(data, project) {
        this.project = project
        this.#refresh(data)
    }

    #refresh(data) {
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

    async fetch() {
        return await utility.execute(`git fetch origin`, this.localpath)
    }

    async getResources(constructor, refresh = false, ttl = 30) {
        return await this.project.getResources(constructor, refresh, ttl, this)
    }

    async createPullRequest(pullRequestTitle, sourceBranch, targetBranch) {

        if (sourceBranch.type == Repository.Branch.LOCAL)
            await sourceBranch.pushRemote()

        if (targetBranch.type == Repository.Branch.LOCAL)
            await targetBranch.pushRemote()

        const active = await this.getResources(Repository.PullRequest, true).then(
            pullRequests => pullRequests.filter(pr =>
                pr.sourceRef.name == sourceBranch.name && pr.targetRef.name == targetBranch.name
            )
        )

        if (active.length === 1)
            throw new Error(`Pull Request already exists as: ${active.at(0).title}`)

        const result = await this.project.post({
            api: `/_apis/git/repositories/${this.id}/pullrequests?api-version=7.0`,
            body: {
                sourceRefName: sourceBranch.name,
                targetRefName: targetBranch.name,
                title: pullRequestTitle,
                description: "",
                reviewers: []
            }
        })

        // Refetch pullrequests 
        return await this.getResources(Repository.PullRequest, true).then(
            pullRequests => pullRequests.filter(pr =>
                pr.sourceRef.name == sourceBranch.name && pr.targetRef.name == targetBranch.name
            )
        )
    }


    /*
        #######################################################
        #### Repository Branches
        #######################################################
    */

    static Branch = class Branch {

        static LOCAL = 'local'
        static REMOTE = 'remote'


        static async from(repository) {
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

        get nameShort() {
            return this.name.split('/').at(-1)
        }

        constructor(data, type, repository) {

            this.type = type

            this.url = data.url
            this.objectId = data.objectId

            this.name = data.name
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

        static STATUS = {
            abandoned: 'abandoned',
            completed: 'completed',
            notSet: 'notSet',
            active: 'active',
            all: 'all',
            merging: 'merging'
        }

        static async from(repository, refresh = false, ttl) {

            let pullrequestCache = await cache.get('pullrequests', repository.project.name, repository.name)

            if (null == pullrequestCache || refresh) {
                pullrequestCache = await repository.project.get({
                    api: `/_apis/git/repositories/${repository.id}/pullrequests?api-version=7.0`,
                    query: {
                        'searchCriteria.status': 'active'
                    }
                })
                await cache.set(pullrequestCache, ttl, 'pullrequests', repository.project.name, repository.name)
            }

            if (pullrequestCache.value.length == 0) return []

            const branches = await repository.branchesRemote
            return pullrequestCache.value.map(data =>
                new Repository.PullRequest(data, repository, branches)
            )
        }

        get Icon() {
            if (this.status == Repository.PullRequest.STATUS.merging)
                return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('devopsscripts.repository'))
            else
                return new vscode.ThemeIcon('git-pull-request', new vscode.ThemeColor('devopsscripts.repository'))
        }

        get commits() {
            return this.repository.project.get(
                `/_apis/git/repositories/${this.repository.id}/pullrequests/${this.pullRequestId}/commits?api-version=7.0`
            ).then(data => data.value)
        }

        constructor(data, repository, branches) {
            this.repository = repository
            this.#refresh(data, branches)
        }

        async refresh() {
            const branches = await this.repository.branchesRemote
            const data = await this.repository.project.get(
                `/_apis/git/repositories/${this.repository.id}/pullrequests/${this.pullRequestId}?api-version=7.0`
            )
            this.#refresh(data, branches)
        }

        #refresh(data, branches) {
            this.pullRequestId = data.pullRequestId
            this.description = data.description
            this.title = data.title
            this.url = data.url

            this.sourceRefName = data.sourceRefName
            this.targetRefName = data.targetRefName

            this.sourceRef = branches.filter(branch => branch.name == data.sourceRefName)[0]
            this.targetRef = branches.filter(branch => branch.name == data.targetRefName)[0]

            this.status = data.status

            this.webUrl = `https://dev.azure.com/${this.repository.project.organization}/${this.repository.project.id}/_git/${this.repository.id}/pullrequest/${data.pullRequestId}`
        }

        async update(parameters) {

            const response = await this.repository.project.patch({
                api: `/_apis/git/repositories/${this.repository.id}/pullrequests/${this.pullRequestId}?api-version=7.0`,
                body: {
                    ...parameters
                }
            })

            const branches = await this.repository.branchesRemote
            this.#refresh(response, branches)

        }

        async merge(mergeStrategy, deleteSourceBranch = false) {

            await this.refresh()
            if (this.status != Repository.PullRequest.STATUS.active)
                throw new Error(`PullRequest not active; status is ${this.status}`)

            const commits = await this.commits
            if (null == commits || commits.length == 0)
                throw new Error('Empty PullRequest, No commits')

            const response = await this.update({
                CompletionOptions: {
                    deleteSourceBranch: deleteSourceBranch,
                    mergeStrategy: mergeStrategy,
                    transitionWorkItems: false,
                    bypassPolicy: false
                },
                LastMergeSourceCommit: {
                    commitId: commits[0].commitId,
                    url: commits[0].url
                },
                status: Repository.PullRequest.STATUS.completed
            })
            this.status = Repository.PullRequest.STATUS.merging

            return response

        }

    }

}

module.exports = Repository