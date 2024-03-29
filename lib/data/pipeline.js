const cache = require('./cache.js')
const vscode = require('vscode')
const interaction = require('../utils/interaction')

class Pipeline {

    static #instances = {}

    static QUEUE_STATUS = {
        enabled: 'enabled',
        disabled: 'disabled',
        paused: 'paused'
    }

    static get IconDefault() {
        return new vscode.ThemeIcon('rocket', new vscode.ThemeColor('devopsscripts.pipeline'))
    }

    static async from(project, refresh = false) {

        let pipelineCache = await cache.get('pipelines', project.name)

        if (null == pipelineCache || refresh) {
            pipelineCache = await project.get(`/_apis/pipelines?api-version=7.0`)

            pipelineCache = pipelineCache.value
                .sort((a, b) => {
                    if (a.name < b.name) return -1
                    else if (a.name > b.name) return 1
                    else return 0
                })

            await cache.set(pipelineCache, null, 'pipelines', project.name)
        }

        return Promise.all(pipelineCache.map(data => {
            if (data.id in Pipeline.#instances) {
                return Pipeline.#instances[data.id].refresh()
            } else {
                const pipeline = new Pipeline(data, project)
                Pipeline.#instances[data.id] = pipeline
                return pipeline.refresh()
            }
        }))

    }

    get Icon() {
        if (this.queueStatus == Pipeline.QUEUE_STATUS.enabled)
            return Pipeline.IconDefault
        else if (this.queueStatus == Pipeline.QUEUE_STATUS.disabled)
            return new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('devopsscripts.disabled'))
        else if (this.queueStatus == Pipeline.QUEUE_STATUS.paused)
            return new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('devopsscripts.disabled'))
    }

    get builds() {
        return this.#builds
    }

    #builds
    constructor(data, project) {

        this.project = project
        this.#refresh(data)
        this.#builds = []

    }

    #refresh(data) {
        this.id = data.id
        this.url = data.url
        this.name = data.name
        this.folder = data.path
        this.revision = data.revision
        this._links = data._links
        this.repository = data.repository
        this.queueStatus = data.queueStatus
    }

    async refresh() {

        const response = await this.project.get(`/_apis/build/definitions/${this.id}?api-version=7.0`)
        this.#refresh(response)

        return this

    }

    async updateSettings(settings) {

        const pipeline = await this.project.get(`/_apis/build/definitions/${this.id}?api-version=6.0`)

        const response = await this.project.put({
            api: `/_apis/build/definitions/${this.id}?api-version=6.0`,
            body: {
                ...pipeline,
                ...settings
            }
        })

        await this.refresh()

    }

    async #startOnBranch(branch) {

        /*
        // Get average time of latest builds to have api polling frequence higher for longer build times.
        const latestSuccessfulBuilds = await this.project.get({
            api: '/_apis/build/builds?api-version=6.0',
            query: {
                definitions: this.id,
                resultFilter: 'succeeded',
                statusFilter: 'completed',
                maxBuildsPerDefinition: 1,
                queryOrder: 'finishTimeDescending'
            }
        })

        let averageTimeForPipeline = -1
        if (latestSuccessfulBuilds.count > 0) {
            averageTimeForPipeline = latestSuccessfulBuilds.value.map(
                build => {
                    const fin = new Date(build.finishTime)
                    const start = new Date(build.startTime)
                    return fin.getTime() - start.getTime()
                }
            )
                .reduce((acc, time) => acc + time)
            averageTimeForPipeline = averageTimeForPipeline / latestSuccessfulBuilds.count / 1000
        }

        */

        const build = await this.project.post({
            api: '/_apis/build/builds?api-version=6.0',
            body: {
                definition: {
                    id: this.id
                },
                sourceBranch: branch.name
            }
        }).then(data => new Pipeline.Build(data, this))

        this.#builds.push(build)

        return build
    }

    async start(branch) {

        await this.refresh()

        if (this.queueStatus != Pipeline.QUEUE_STATUS.enabled) return

        return await this.#startOnBranch(branch)

    }






    /*
        #######################################################
        #### Pipeline Builds
        #######################################################
    */

    static Build = class Build {

        static STATUSES = {
            cancelling: 'cancelling',
            completed: 'completed',
            inProgress: 'inProgress',
            none: 'none',
            notStarted: 'notStarted',
            postponed: 'postponed'
        }

        static RESULTS = {
            canceled: 'canceled',
            failed: 'failed',
            inProgress: 'inProgress',
            none: 'none',
            partiallySucceeded: 'partiallySucceeded',
            succeeded: 'succeeded'
        }

        get Icon() {

            if (this.status == Pipeline.Build.STATUSES.notStarted)
                return new vscode.ThemeIcon('sync', new vscode.ThemeColor('testing.iconQueued'))

            if (this.status == Pipeline.Build.STATUSES.inProgress)
                return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('testing.runAction'))


            if (this.result == Pipeline.Build.RESULTS.canceled || this.status == Pipeline.Build.STATUSES.cancelling)
                return new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconSkipped'))

            if (this.result == Pipeline.Build.RESULTS.failed)
                return new vscode.ThemeIcon('close', new vscode.ThemeColor('testing.iconFailed'))

            if (this.result == Pipeline.Build.RESULTS.succeeded)
                return new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'))


            return new vscode.ThemeIcon('circle-outline')
        }

        #onChange
        set onChange(value) {
            this.#onChange = value
        }

        constructor(data, pipeline) {

            this.id = data.id
            this.url = data.url
            this.uri = data.uri
            this._links = data._links
            this.reason = data.reason
            this.priority = data.priority
            this.sourceBranch = data.sourceBranch
            this.status = data.status
            this.result = data.result
            this.pipeline = pipeline

            this.maxPollRateSeconds = 60
            this.pollRateQueued = 5
            this.pollRateAfterStart = 10

            this.showInTreeView = true

            setTimeout(() => this.pollState(), this.pollRateQueued * 1000)
        }

        async pollState() {

            try {
                const build = await this.pipeline.project.get(`/_apis/build/builds/${this.id}?api-version=7.0`)
                const hasChanged = this.status != build.status || this.result != build.result
                this.result = build.result
                this.status = build.status

                if (hasChanged) this.#onChange?.call(this)

                // TODO
                if (this.status == Pipeline.Build.STATUSES.notStarted)
                    setTimeout(() => this.pollState(), this.pollRateQueued * 1000)
                else if (this.status == Pipeline.Build.STATUSES.inProgress)
                    setTimeout(() => this.pollState(), this.pollRateQueued * 1000)

            } catch (exception) {
                await vscode.window.showErrorMessage(JSON.stringify(exception.message))
            }

        }


        async cancelBuild() {

            const response = await this.pipeline.project.patch({
                api: `/_apis/build/builds/${this.id}?api-version=7.0`,
                body: {
                    status: Pipeline.Build.STATUSES.cancelling
                }
            })

            this.status = Pipeline.Build.STATUSES.cancelling
            this.#onChange?.call(this)

        }
    }


}

module.exports = Pipeline