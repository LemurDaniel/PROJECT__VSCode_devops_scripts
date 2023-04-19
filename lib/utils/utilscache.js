const fs = require('fs')

if (!(fs.existsSync(`${__dirname}\\cache`))) {
    fs.mkdirSync(`${__dirname}\\cache`)
}

class Utilscache {

    static path(type, identifier) {
        return `${__dirname}\\cache\\${type}.${identifier}.json`
    }

    static get(type, identifier) {

        if (fs.existsSync(Utilscache.path(type, identifier))) {
            const cache = JSON.parse(
                fs.readFileSync(Utilscache.path(type, identifier))
            )

            if (cache.expires > Date.now) {
                return cache.content
            }
        }

        return null

    }

    static set(type, identifier, data, ttl = 4) {

        const cache = {
            content: data,
            expires: Date.now() + (ttl * 60)
        }

        fs.writeFileSync(
            Utilscache.path(type, identifier),
            JSON.stringify(cache),
            'utf-8'
        )

        return data

    }
}


module.exports = Utilscache