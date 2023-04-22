const fs = require('fs')

if (!(fs.existsSync(`${__dirname}\\cache`))) {
    fs.mkdirSync(`${__dirname}\\cache`)
}

class Utilscache {

    static path(type, identifier) {
        const filename = `${type}.${identifier}.json`.replace(/[/\\?%*:|"<>\s]/g, '_').toLowerCase()
        return `${__dirname}\\cache\\${filename}`;
    }

    static get(type, identifier) {

        if (fs.existsSync(Utilscache.path(type, identifier))) {
            const cache = JSON.parse(
                fs.readFileSync(Utilscache.path(type, identifier))
            )

            if (cache.expires == null || cache.expires > Date.now()) {
                return cache.content
            }
        }

        return null

    }

    static set(type, identifier, data, ttl = 4) {

        const cache = {
            content: data,
            expires: ttl == null ? null : (Date.now() + ttl * 3600 * 1000)
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