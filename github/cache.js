const Utilscache = require('../lib/utils/utilscache')


class GithubCache extends Utilscache {

    static get(type, identifier) {
        identifier = `lemurdaniel.${identifier}`
        return super.get(type, identifier)
    }

    static set(type, identifier, data, ttl) {
        identifier = `lemurdaniel.${identifier}`
        return super.set(type, identifier, data, ttl)
    }
}


module.exports = GithubCache