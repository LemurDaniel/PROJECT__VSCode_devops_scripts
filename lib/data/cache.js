const Utilscache = require('../utils/utilscache')
const devops = require('./api')

class DevopsCache extends Utilscache {

    static init(globalState) {
        Utilscache.init(globalState)
    }

    static async del(type, identifier, subidentifier = null, subidentifier2 = null) {
        const organization = await devops.User.current.then(user => user.currentOrganization)
        return Utilscache.instance.del([organization, type, identifier, subidentifier, subidentifier2])
    }

    static async get(type, identifier, subidentifier = null, subidentifier2 = null) {
        const organization = await devops.User.current.then(user => user.currentOrganization)
        //return super.get(user.currentOrganization, ...Object.values(arguments))
        return Utilscache.instance.get([organization, type, identifier, subidentifier, subidentifier2])
    }

    static async set(data, ttl, type, identifier, subidentifier = null, subidentifier2 = null) {
        const organization = await devops.User.current.then(user => user.currentOrganization)
        return Utilscache.instance.set(data, ttl, [organization, type, identifier, subidentifier, subidentifier2])
    }

}

module.exports = DevopsCache