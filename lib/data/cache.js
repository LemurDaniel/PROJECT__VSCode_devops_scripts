const Utilscache = require('../utils/utilscache')
const devops = require('./api')

class DevopsCache extends Utilscache {

    static async del(type, identifier, subidentifier = null, subidentifier2 = null) {
        const user = await devops.User.current
        return super.del([user.currentOrganization, type, identifier, subidentifier, subidentifier2])
    }

    static async get(type, identifier, subidentifier = null, subidentifier2 = null) {
        const user = await devops.User.current
        //return super.get(user.currentOrganization, ...Object.values(arguments))
        return super.get([user.currentOrganization, type, identifier, subidentifier, subidentifier2])
    }

    static async set(data, ttl, type, identifier, subidentifier = null, subidentifier2 = null) {
        const user = await devops.User.current
        return super.set(data, ttl, [user.currentOrganization, type, identifier, subidentifier, subidentifier2])
    }

}

module.exports = DevopsCache