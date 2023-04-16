const Utilscache = require('../utils/utilscache')


class Githubcache {

    #key(identifier, type) {
        return `lemurdaniel.${identifier}.${type}`
    }

    static get(identifier, type) {

        return Utilscache.get(
            Githubcache.#key(identifier, type)
        )

    }

    static set(identifier, type, data, ttl) {

        return Utilscache.set(
            Githubcache.#key(identifier, type),
            data, ttl
        )

    }
}


module.exports = Utilscache