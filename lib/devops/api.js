const SecretData = require('../utils/SecretData')
const https = require('https')
const vscode = require('vscode');

class DevOps {

    static #instance = null
    static PAT = 'devops_token'

    static instance() {
        if (null == DevOps.#instance) {
            DevOps.#instance = new DevOps()
        }
        return DevOps.#instance
    }

    async user_request_token() {
        let token = await vscode.window.showInputBox({
            password: true
        })
        await SecretData.instance().store(DevOps.PAT, token)
        return token
    }

    async get(request) {
        return await this.rest({
            ...request,
            method: 'get',
            body: null
        })
    }

    async post(request) {
        return await this.rest({
            ...request,
            method: 'post'
        })
    }


    async rest(request) {

        request = {
            api: '',
            domain: 'dev.azure.com',
            scope: 'org',
            query: {},
            team: 'DC Azure Migration Team',
            project: 'DC Azure Migration',
            organization: 'baugruppe',
            body: null,
            ...request
        }

        const token = await SecretData.instance().get(DevOps.PAT)
        if (null == token) {
            vscode.window.showErrorMessage('No devops pat')
            this.user_request_token()
            return
        }

        const team = request.team
        const project = request.project
        const organization = request.organization
        const endpoint = request.api.split('?')[0]

        request.api.split('?')[1]?.split('&').map(val => val.split('=')).forEach(([key, val]) => request.query[key] = val)
        const queryParams = Object.entries(request.query).map(([key, val]) => `${key}=${val}`)?.join('&') ?? ''

        const contentType = request.contentType ?? (request.method == 'get' ? 'application/x-www-form-urlencoded; charset=utf-8' : 'application/json; charset=utf-8')
        const patBase64 = Buffer.from(`:${token}`).toString('base64')
        const options = {
            protocol: 'https:',
            port: 443,
            method: request.method,
            hostname: request.domain,
            path: null,
            headers: {
                username: 'O.o',
                Authorization: `Basic ${patBase64}`,
                'Content-Type': contentType
            },
            body: Buffer.from(
                JSON.stringify(request.body)
            )
        }

        let targetPath = ""
        switch (request.scope.toUpperCase()) {
            case 'NONE':
                options.path = `/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
                break
            case 'ORG':
                options.path = `/${organization}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
                break
            case 'PROJ':
                options.path = `/${organization}/${project}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
                break
            case 'TEAM':
                options.path = `/${organization}/${project}/${team}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
                break

            default:
                throw `${scop} Not Supported`
        }

        return new Promise((resolve, reject) => {
            const request = https.request(options, res => {
                let content = ''
                res.setEncoding('utf-8')
                    .on('data', e => content += e.toString())
                    .on('end', e => resolve(JSON.parse(content)))
                    .on('error', reject)
            })
            request.write(options.body)
            request.end()
        })


    }

}

module.exports = DevOps.instance()