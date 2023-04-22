const Utilscache = require('../utils/utilscache')
const devops = require('./api')

class DevopsCache extends Utilscache {

    static async get(type, identifier) {
        const user = await devops.User.current
        const organization = user.organization.current.accountName
        identifier = `${organization}.${identifier}`
        return super.get(type, identifier)
    }

    static async set(type, identifier, data, ttl) {
        const user = await devops.User.current
        const organization = user.organization.current.accountName
        identifier = `${organization}.${identifier}`
        return super.set(type, identifier, data, ttl)
    }
}


module.exports = DevopsCache