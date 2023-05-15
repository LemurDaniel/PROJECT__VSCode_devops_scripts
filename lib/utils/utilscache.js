const fs = require('fs')
const pathUtils = require('path')
const output = require('../output')

class Utilscache {

    static #instance = null
    static get instance() {
        if (null == Utilscache.#instance)
            throw new Error('Not initialized')

        return Utilscache.#instance
    }

    static init(globalStorageFsPath) {
        Utilscache.#instance = new Utilscache(globalStorageFsPath)
        return Utilscache.#instance
    }

    constructor(globalStorageFsPath) {
        this.globalStorageFsPath = globalStorageFsPath
        if (!(fs.existsSync(globalStorageFsPath))) {
            fs.mkdirSync(globalStorageFsPath, {
                recursive: true
            })
        }
    }


    path(identifiers) {
        const filename = `${identifiers.filter(v => v != null).join('.')}.json`
        return pathUtils.join(this.globalStorageFsPath, filename)
    }

    del(identifiers) {
        return this.#del(this.path(identifiers))
    }

    #del(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    get(identifiers) {
        return this.#get(this.path(identifiers))
    }

    #get(path) {

        if (!fs.existsSync(path)) return null

        const cache = JSON.parse(fs.readFileSync(path))
        if (cache.expires == null || cache.expires > Date.now()) {
            return cache.content
        }

        return null
    }

    set(data, ttl, identifiers) {
        return this.#set(data, ttl, this.path(identifiers))
    }

    #set(data, ttl, path) {

        const cache = {
            content: data,
            expires: ttl == null ? null : (Date.now() + 1000 * (ttl ?? (4 * 3600)))
        }

        fs.writeFileSync(path, JSON.stringify(cache))

        return data

    }
}


module.exports = Utilscache