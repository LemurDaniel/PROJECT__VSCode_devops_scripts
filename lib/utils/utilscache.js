const fs = require('fs')


class Utilscache {

    static #path(key) {
        return `${__dirname}\\${key}.json`
    }

    static get(key) {

        if (fs.existsSync(Utilscache.#path(key))) {
            const cache = JSON.parse(
                fs.readFileSync(Utilscache.#path(key))
            )

            if (cache.expires > Date.now) {
                return cache.content
            }
        }

        return {}

    }

    static set(key, data, ttl) {

        const cache = {
            content: data,
            expires: Date.now() + (ttl * 60)
        }

        fs.writeFileSync(
            Utilscache.#path(key),
            JSON.stringify(cache),
            'utf-8'
        )

        return data

    }
}


module.exports = Utilscache