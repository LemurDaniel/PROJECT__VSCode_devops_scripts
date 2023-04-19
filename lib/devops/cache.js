const Utilscache = require('../utils/utilscache')


class DevopsCache extends Utilscache {

    static get(type, identifier) {
        identifier = `baugruppe.${identifier}`
        return super.get(type, identifier)
    }

    static set(type, identifier, data, ttl) {

        identifier = `baugruppe.${identifier}`
        return super.set(type, identifier, data, ttl)
    }
}


module.exports = DevopsCache