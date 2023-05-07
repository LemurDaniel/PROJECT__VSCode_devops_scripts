const fs = require('fs')
const output = require('../output')

if (!(fs.existsSync(`${__dirname}\\cache`))) {
    fs.mkdirSync(`${__dirname}\\cache`)
}

class Utilscache {

    static path(identifiers) {
        const filename = `${identifiers.filter(v => v != null).join('.')}.json`.replace(/[/\\?%*:|"<>\s]/g, '_').toLowerCase()
        return `${__dirname}\\cache\\${filename}`;
    }

    static del(identifiers) {
        return Utilscache.#del(Utilscache.path(identifiers))
    }

    static #del(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    static get(identifiers) {
        return Utilscache.#get(Utilscache.path(identifiers))
    }

    static #get(path) {

        if (fs.existsSync(path)) {
            const cache = JSON.parse(
                fs.readFileSync(path)
            )

            if (cache.expires == null || cache.expires > Date.now()) {
                return cache.content
            }
        }

        return null
    }

    static set(data, ttl, identifiers) {
        return Utilscache.#set(data, ttl, Utilscache.path(identifiers))
    }

    static #set(data, ttl, path) {

        const cache = {
            content: data,
            expires: ttl == false ? null : (Date.now() + 1000 * (ttl ?? (4 * 3600)))
        }

        fs.writeFile(path, JSON.stringify(cache), 'utf-8', (error) => {if(error) output.appendLine(error)})

        return data

    }
}


module.exports = Utilscache