const output = require('../output')

class Utilscache {

    static #instance = null
    static get instance() {
        if (null == Utilscache.#instance)
            throw new Error('Not initialized')

        return Utilscache.#instance
    }

    static init(globalState) {
        Utilscache.#instance = new Utilscache(globalState)
        return Utilscache.#instance
    }

    constructor(globalState) {
        this.globalState = globalState
    }


    path(identifiers) {
        return identifiers.filter(v => v != null).join('.')
    }

    del(identifiers) {
        return this.#del(this.path(identifiers))
    }

    #del(path) {
        this.globalState.update(path, undefined)
    }

    get(identifiers) {
        return this.#get(this.path(identifiers))
    }

    #get(path) {
        const cache = this.globalState.get(path)

        if(null == cache) return

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

        this.globalState.update(path, cache)

        return data

    }
}


module.exports = Utilscache