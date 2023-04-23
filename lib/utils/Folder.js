// Groups any objects by a provided Folderpath
class Folder {

    static group(elements, path = element => element) {

        const folder = new Folder()
        elements.forEach(element => folder.add(path(element), element))
        return folder

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
    constructor() {
        this.name = '/'
        this.#folders = {}
        this.#content = []
    }


    add(path, payload = null) {

        let node = this
        const pathArray = path.replace(/[\/\\]+/g, '/').split('/').filter(segment => segment.length > 0)

        for (const segment of pathArray) {

            if (!(segment in node.#folders))
                node.#folders[segment] = new Folder()

            node = node.#folders[segment]
            node.name = segment

        }

        if (null != payload)
            node.#content.push(payload)

        return this
    }
}


module.exports = Folder