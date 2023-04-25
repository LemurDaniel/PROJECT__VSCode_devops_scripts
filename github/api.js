const SecretData = require('../lib/utils/SecretData')
const https = require('https')
const vscode = require('vscode');

class Github {

    static #instance = null
    static GITHUB_TOKEN = 'github_token'

    static instance() {
        if (null == Github.#instance) {
            Github.#instance = new Github()
        }
        return Github.#instance
    }

    async user_request_token() {
        const token = await vscode.window.showInputBox({
            password: true
        })
        await SecretData.instance().store(Github.GITHUB_TOKEN, token)
        return token
    }

    async rest(
        method,
        api,
        query = {},
        body = {},
        context = null,
    ) {


        const token = await SecretData.instance().get(Github.GITHUB_TOKEN)
        if (null == token) {
            vscode.window.showErrorMessage('No githubtoken')
            this.user_request_token()
            return
        }

        const affiliation = 'owner,collaborator,organization_member'
        const contentType = 'application/vnd.github+json'
        const visibility = 'all'
        const apiVersion = '2022-11-28'


        // Build a hashtable of providedy Query params and Query params in provied api-url.
        query['affiliation'] = affiliation
        query['visibility'] = visibility
        query['per_page'] = 100

        request.api.split('?')[1]?.split('&').map(val => val.split('=')).forEach(([key, val]) => request.query[key] = val)
        const queryParams = Object.entries(request.query).map(([key, val]) => `${key}=${val}`).join('&') ?? ''

        //$bodyByteArray = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 8 -Compress -AsArray:$AsArray))
        const address = `api.github.com/${api}?${queryParams}`.replace(/[/]+/g, '/')

        const options = {
            method: method,
            hostname: 'api.github.com',
            path: `/user?${queryParams}`,
            headers: {
                'User-Agent': 'https://github.com/LemurDaniel/PROJECT__VSCode_extension_devopsscripts',
                Accept: contentType,
                'X-GitHub-Api-Version': apiVersion,
                Authorization: `Bearer ${token}`
            }
        }

        return new Promise((resolve, reject) => {
            https.request(options, res => {
                let content = ''
                res.setEncoding('utf-8')
                    .on('data', e => content += e.toString())
                    .on('end', e => resolve(JSON.parse(content)))
                    .on('error', reject)
            })
        })

    }

}

module.exports = Github.instance()