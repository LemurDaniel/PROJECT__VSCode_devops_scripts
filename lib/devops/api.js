const SecretData = require('../utils/SecretData')
const https = require('https')
const vscode = require('vscode');

class DevOps {

    static #instance = null

    static instance() {
        if (null == DevOps.#instance) {
            DevOps.#instance = new DevOps()
        }
        return DevOps.#instance
    }




    static Authentication = class Authentication {

        static PAT = 'devops_token'
        static async #user_request_token() {
            let token = await vscode.window.showInputBox({
                password: true
            })
            await SecretData.instance().store(DevOps.PAT, token)
            return token
        }

        static async fromPAT() {

            let token = await SecretData.instance().get(DevOps.Authentication.PAT)
            if (null == token) {
                vscode.window.showErrorMessage('No devops pat')
                token = await this.user_request_token()
            }

            const patBase64 = Buffer.from(`:${token}`).toString('base64')

            return {
                username: 'O.o',
                Authorization: `Basic ${patBase64}`
            }

        }

        static async fromInteractiveFlow() {

            try {
                const token = await vscode.authentication.getSession("microsoft",
                    [
                        '499b84ac-1321-427f-aa17-267ca6975798/user_impersonation'
                    ],
                    {
                        createIfNone: true
                    }
                )
               
                return {
                    username: 'O.o',
                    Authorization: `Bearer ${token.accessToken}`
                }
            } catch (exception) {
                await vscode.window.showErrorMessage(JSON.stringify(exception.message))
            }

        }

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


        const team = request.team
        const project = request.project
        const organization = request.organization
        const endpoint = request.api.split('?')[0]

        request.api.split('?')[1]?.split('&').map(val => val.split('=')).forEach(([key, val]) => request.query[key] = val)
        const queryParams = Object.entries(request.query).map(([key, val]) => `${key}=${val}`)?.join('&') ?? ''

        const contentType = request.contentType ?? (request.method == 'get' ? 'application/x-www-form-urlencoded; charset=utf-8' : 'application/json; charset=utf-8')
        const authenticationHeader = await DevOps.Authentication.fromInteractiveFlow()
        const options = {
            protocol: 'https:',
            port: 443,
            method: request.method,
            hostname: request.domain,
            path: null,
            headers: {
                ...authenticationHeader,
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