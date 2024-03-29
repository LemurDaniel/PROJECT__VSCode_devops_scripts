const SecretData = require('../utils/SecretData')
const Utilscache = require('../utils/utilscache')
const https = require('https')
const vscode = require('vscode')
const output = require('../output')

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
            return DevOps.instance.User.getCurrentUser()
        }

        static async getCurrentUser(refresh = true) {

            try {

                if (refresh || null == this.#instance) {

                    if (null == this.#instance)
                        this.#instance = new DevOps.instance.User()

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

                    this.#instance.id = user.id
                    this.#instance.displayName = user.displayName
                    this.#instance.publicAlias = user.publicAlias
                    this.#instance.emailAddress = user.emailAddress.toLowerCase()
                    this.#instance.isInitialized = true
                    this.#instance.connectedOrganizations = organizations.value.length
                    this.#instance.organization = {
                        current: null,
                        all: organizations.value
                    }

                    let currentOrganization = vscode.workspace.getConfiguration('devops').get('organization.default')
                    currentOrganization = (currentOrganization[this.#instance.emailAddress] ?? organizations.value[0])?.accountName

                    this.#instance.setCurrentOrganization(currentOrganization)

                }

            }
            catch (exception) { }
            finally {

                if (this.#instance.connectedOrganizations == 0) {
                    throw new Error(`No Azure DevOps Organizations connected to '${this.#instance.emailAddress}' could be found!`)
                } else if (!this.#instance.isInitialized) {
                    throw new Error('Something went wrond during login')
                }
                else {
                    return this.#instance
                }
            }

        }





        get currentOrganization() {
            return this.organization.current.accountName
        }

        constructor() {
            this.id = null
            this.displayName = null
            this.publicAlias = null
            this.emailAddress = null
            this.organization = null
            this.identity = null
            this.connectedOrganizations = 0
            this.isInitialized = false
        }

        async setCurrentOrganization(name) {
            this.organization.current = this.organization.all.filter(org => org.accountName == name).at(0)
            const configuration = vscode.workspace.getConfiguration('devops')
            configuration.update('organization.default', {
                ...configuration.organization.default,
                [this.emailAddress]: this.organization.current
            }, true)
            // this.identity = await this.#getIdentity().then(data => data.value.at(0))
        }

        async #getIdentity() {
            return await DevOps.instance.get({
                organization: this.currentOrganization,
                domain: 'vssps.dev.azure.com',
                api: '_apis/identities?api-version=6.0',
                query: {
                    filterValue: this.emailAddress,
                    queryMembership: 'None',
                    searchFilter: 'General'
                }
            })
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

        static async fromInteractiveFlow(forceNew = false) {

            try {
                const token = await vscode.authentication.getSession("microsoft",
                    [
                        '499b84ac-1321-427f-aa17-267ca6975798/user_impersonation'
                    ],

                    forceNew ? (
                        {
                            forceNewSession: true
                        }
                    ) : [
                        {
                            createIfNone: true
                        }
                    ]

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




    async forceNewSession() {
        await DevOps.Authentication.fromInteractiveFlow(true)
        await DevOps.instance.User.getCurrentUser(true)
    }

    get(request) {
        return this.rest({
            ...request,
            method: 'get',
            body: null
        })
    }

    post(request) {
        return this.rest({
            ...request,
            method: 'post'
        })
    }

    patch(request) {
        return this.rest({
            ...request,
            method: 'patch'
        })
    }

    put(request) {
        return this.rest({
            ...request,
            method: 'put'
        })
    }

    async rest(request) {

        const endpoint = request.api.split('?')[0]

        const query = request.query ?? {}
        request.api.split('?')[1]?.split('&').map(val => val.split('=')).forEach(([key, val]) => query[key] = val)
        const queryParams = Object.entries((query)).map(([key, val]) => `${key}=${val}`)?.join('&') ?? ''

        const contentType = request.contentType ?? (request.method == 'get' ? 'application/x-www-form-urlencoded; charset=utf-8' : 'application/json; charset=utf-8')
        const authenticationHeader = await DevOps.Authentication.fromInteractiveFlow()
        const options = {
            protocol: 'https:',
            port: 443,
            method: request.method.toUpperCase(),
            hostname: request.domain,
            path: null,
            headers: {
                ...authenticationHeader,
                'Content-Type': contentType
            },
            body: request.body == null ? null : Buffer.from(
                JSON.stringify(request.body)
            )
        }

        let [organization, project, team] = [request.organization, request.project, request.team]
        if (request.scope?.toUpperCase() != 'NONE' && null == organization) {
            const user = await this.User.current
            organization = user.organization.current.accountName
        }

        if (null != team || request.scope?.toUpperCase() == 'TEAM') {
            options.path = `/${organization}/${project}/${team}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
        }
        else if (null != project || request.scope?.toUpperCase() == 'PROJECT') {
            options.path = `/${organization}/${project}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
        }
        else if (null != organization || request.scope?.toUpperCase() == 'ORGANIZATION') {
            options.path = `/${organization}/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
        }
        else {
            options.path = `/${endpoint}?${queryParams}`.replace(/\s/g, '%20')
        }

        //output.appendLine('----------------------------------------------------------')
        //output.appendLine(options.path)
        //output.appendLine(JSON.stringify(request.body))
        //output.appendLine('----------------------------------------------------------')
        const response = await new Promise((resolve, reject) => {
            try {
                const request = https.request(options, res => {
                    let content = ''
                    res.setEncoding('utf-8')
                        .on('data', e => content += e.toString())
                        .on('end', e => resolve(JSON.parse(content)))
                        .on('error', reject)
                })
                if (options.body) request.write(options.body)
                request.end()
            } catch (exception) {
                reject(exception)
            }
        })
        //output.appendLine(JSON.stringify(response))
        //output.appendLine('----------------------------------------------------------')

        return response
    }

}

module.exports = DevOps.instance