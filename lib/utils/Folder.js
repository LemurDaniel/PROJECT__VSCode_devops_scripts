// Groups any objects by a provided Folderpath
class Folder {

    static group(elements, path = element => element) {

        const folder = new Folder()
        elements.forEach(element => folder.add(path(element), element))
        return folder

    }




    get properties() {
        return this.#properties
    }

    get folders() {
        return Object.values(this.#folders)
    }

    get content() {
        return this.#content
    }

    get all() {
        return this.folders.concat(this.content)
    }

    #folders
    #content
    #properties
    constructor(name = '/', content = [], properties = {}) {
        this.name = name
        this.#folders = {}
        this.#content = content instanceof Array ? content : [content]
        this.#properties = properties
    }


    add(path, payload = null, properties = null) {

        let node = this
        const pathArray = path.replace(/[\/\\]+/g, '/').split('/').filter(segment => segment.length > 0)

        for (const segment of pathArray) {

            if (!(segment in node.#folders))
                node.#folders[segment] = new Folder(segment)

            node = node.#folders[segment]

        }

        if (null != payload)
            node.#content.push(payload)

        if(null != properties)
            node.#properties = { ...node.#properties, ...properties }

        return this
    }
}


module.exports = Folder