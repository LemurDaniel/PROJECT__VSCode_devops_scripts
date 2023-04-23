const SecretData = require('../utils/SecretData')
const Utilscache = require('../utils/utilscache')
const https = require('https')
const vscode = require('vscode')

class DevOps {

    static #instance = null

    static get instance() {
        if (null == DevOps.#instance) {
            DevOps.#instance = new DevOps()
        }
        return DevOps.#instance
    }






    User = class User {

        static #instance
        static get current() {
            try {
                DevOps.instance.User.getCurrentUser()
            } catch (exception) {
                vscode.window.showInformationMessage(JSON.stringify(exception.message))
            }
            return DevOps.instance.User.getCurrentUser()
        }

        static async getCurrentUser(refresh = false) {

            if (refresh || null == DevOps.instance.User.#instance) {

                const user = await DevOps.instance.get({
                    scope: 'None',
                    domain: 'app.vssps.visualstudio.com',
                    api: '_apis/profile/profiles/me?api-version=6.0'
                })

                const organizations = await DevOps.instance.get({
                    scope: 'None',
                    domain: 'app.vssps.visualstudio.com',
                    api: '_apis/accounts?api-version=6.0',
                    query: {
                        memberId: user.publicAlias
                    }
                })

                const currentOrganization = await Utilscache.get('currentOrganization', user.displayName)

                this.#instance = new DevOps.instance.User()
                this.#instance.id = user.id
                this.#instance.displayName = user.displayName
                this.#instance.publicAlias = user.publicAlias
                this.#instance.emailAddress = user.emailAddress
                this.#instance.organization = {
                    current: currentOrganization ?? organizations.value[0],
                    all: organizations.value
                }
            }

            return this.#instance

        }





        get currentOrganization() {
            return this.organization.current.accountName
        }

        set currentOrganization(name) {
            this.organization.current = this.organization.all.filter(org => org.accountName == name)[0]
            Utilscache.set('currentOrganization', this.displayName, this.organization.current, null)
        }

        constructor() {
            this.id = null
            this.displayName = null
            this.publicAlias = null
            this.emailAddress = null
            this.organization = null
        }
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
            body: null,
            ...request
        }

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

        let [organization, project, team] = [request.organization, request.project, request.team]
        if (request.scope.toUpperCase() != 'NONE' && null == organization) {
            const user = await this.User.current
            organization = user.organization.current.accountName
        }
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

module.exports = DevOps.instance