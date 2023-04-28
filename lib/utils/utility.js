const process = require('child_process');


/**
 * Executes a command in a working directory
 * 
 * @param command - a command like git (needs to be on path)
 * @param directory - (optional) working directory for executing the command
 * @param args - (optional) array of arguments
 */
function execute(command, directory = null, args = []) {

    return new Promise((resolve, reject) => {
        command = args.reduce((acc, arg) => `${acc} ${arg}`, command)
        process.exec(command, { cwd: directory }, (err, stdout, stderr) => {
            if (err)
                reject(err)
            else if (stderr)
                reject(stderr)
            else
                resolve(stdout)
        })
    })

}

/**
 * Trims character from the start and end of a string
 * 
 * @param str - a string to trim
 * @param character - a character to trim
 */
function trimEnd(str, character) {

    const array = str.split('')
    while (array.length > 0 && array.at(-1) == character) array.pop()
    console.log(str, array.join(''), character)
    return array.join('')

}

/**
 * Groups elements with a similar prefix
 * 
 * @param values - values to group by prefix
 * @param minGroupCount - minimum of elements to appear in a prefix, to be grouped
 * @param minGroupCount - minimum length of a prefix to use as a group
 * @param minGroupCount - if values not an array of string, callback function to resolve to string, like name of element. 
 * @param delimiters - delimiters to split and group values by
 */
function groupSimilar(values, minGroupCount, minPrefixLength, property = value => value, delimiters = ['-', '_', ' ', '/', '.']) {

    const processed = {}
    const groupings = {
        ungrouped: [],
        groupCount: 0,
        grouped: {}
    }

    while (values.length > 0) {

        const initial = property(values[0])

        for (let i = initial.length - 1; i >= 0; i--) {

            const nextIndex = delimiters
                .map(del => initial.substring(i).indexOf(del))
                .filter(index => index > 0)
                .reduce((acc, v) => Math.min(acc, v + i + 1), Number.MAX_SAFE_INTEGER)

            if (nextIndex == Number.MAX_SAFE_INTEGER && i > 0)
                continue
            else if (i == 0) {
                processed[initial] = values[0]
                groupings.ungrouped.push(values[0])
                break
            }


            const prefix = initial.substring(0, nextIndex)
        
            // Filter all values that match the current prefix
            const remaining = values.filter(
                value => property(value).substring(0, nextIndex).toLowerCase() == prefix.toLowerCase()
            )

            if (remaining.length >= minGroupCount && prefix.length >= minPrefixLength) {

                // Remove all delimiters from prefix to use as group Name
                const groupName = delimiters.reduce((prefix, delimiter) => trimEnd(prefix, delimiter), prefix)
                groupings.grouped[groupName] = remaining
                groupings.groupCount++

                // Remove processed values from map.
                remaining.forEach(value => processed[property(value)] = value)
                break
            }
        }

        // Remove processed values from values array
        values = values.filter(value => !(property(value) in processed))
    }

    return groupings
}

module.exports = {
    execute,
    groupSimilar
}