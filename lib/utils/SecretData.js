
class SecretData {

    static #instance
    #secrets

    constructor(secrets) {
        this.#secrets = secrets
    }

    static init(context) {
        SecretData.#instance = new SecretData(context.secrets)
    }

    static instance() {
        if (null === SecretData.#instance) {
            throw "Not initialized"
        } else {
            return SecretData.#instance
        }
    }

    async store(identifier, data) {
        this.#secrets.store(identifier, data)
    }

    async get(identifier) {
        return this.#secrets.get(identifier)
    }

}

module.exports = SecretData