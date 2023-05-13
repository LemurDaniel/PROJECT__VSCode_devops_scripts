
// trying something
class Trie {

    Node = class Node {

        get entries() {
            if (Object.values(this.children) == 0)
                return this.payload
            else
                return Object.values(this.children).reduce((acc, child) => acc.concat(child.entries), [])
        }

        get childCount() {
            return Object.values(this.children).length + Object.values(this.children).reduce((acc, child) => acc + child.childCount, 0)
        }
        // Saves whole prefixes in one Node.
        // Subdivides existing nodes in subnodes when word with same prefix is added.
        constructor(prefix, payload = null) {
            this.prefix = prefix
            this.payload = payload
            this.children = {}
        }

        getCommonPrefix(word) {

            let existing = Object.keys(this.children)
            if (existing.length == 0)
                return null

            for (let i = 0; i < word.length; i++) {

                const prefix = word.substring(0, i)
                const remaining = existing.filter(value => value.substring(0, i) == prefix)

                if (remaining.length == 0) {

                    if (existing.length != 1 || i < 2)
                        return null

                    const commonPrefix = word.substring(0, i - 1)

                    // case full prefix is a child, return it.
                    if (commonPrefix in this.children)
                        return this.children[commonPrefix]

                    // else cut the child with same prefix into a subchild with common parent.
                    const existingChild = this.children[existing[0]]
                    delete this.children[existingChild.prefix]
                    existingChild.prefix = existingChild.prefix.substring(commonPrefix.length)

                    console.log(existing, commonPrefix)

                    const commonParent = new Node(commonPrefix)
                    this.children[commonPrefix] = commonParent
                    commonParent.children[existingChild.prefix] = existingChild

                    return commonParent

                } else
                    existing = remaining

            }
        }


        // TODO not working properly
        getPrefixGroupings(minPrefixLength, minChildCount, parentPrefix = '') {

            const maxDepth = 5
            const result = {
                depth: 0,
                groups: [],
                ungrouped: []
            }

            if (Object.values(this.children).length == 0) {
                return result
            }

            for (const child of Object.values(this.children)) {

                const prefix = parentPrefix + child.prefix
                const childResult = child.getPrefixGroupings(minPrefixLength, minChildCount, prefix)

                if (childResult.groups.length == 0 && childResult.depth + 1 <= maxDepth && prefix.length >= minPrefixLength && child.childCount >= minChildCount) {
                    result.groups.push({
                        prefix: prefix,
                        container: child.entries
                    })
                }
                else if (childResult.groups.length > 0) {
                    result.groups = result.groups.concat(childResult.groups)
                }
                else {
                    result.ungrouped = result.ungrouped.concat(child.entries)
                }

                result.depth = Math.max(childResult.depth + 1, result.depth)
                result.ungrouped = result.ungrouped.concat(child.ungrouped)
            }

            return result
        }

    }





    get root() {
        return this.#root
    }
    #root
    constructor() {
        this.#root = new this.Node('')
    }

    add(prefix, payload) {

        let node = this.#root
        payload = payload ?? prefix
        while (prefix.length > 0) {

            const commonParent = node.getCommonPrefix(prefix)
            if (null == commonParent) {
                node.children[prefix] = new this.Node(prefix, payload)
                return
            } else {
                node = commonParent
                prefix = prefix.substring(commonParent.prefix.length)
            }
        }

    }

    getPrefixGroupings(minPrefixLength, minChildCount) {
        return this.#root.getPrefixGroupings(minPrefixLength, minChildCount)
    }

}


// Testing finding similar prefixes via trie
const trie = new Trie()

repos.forEach(repo => trie.add(repo.name))

fs.writeFileSync('./test.json', JSON.stringify(trie.root))

console.log(trie.root.childCount)

console.log(trie.getPrefixGroupings(8, 4))