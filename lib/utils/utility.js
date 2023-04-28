const process = require('child_process');

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

function trimEnd(str, character) {

    const array = str.split('')
    while (array.length > 0 && array.at(-1) == character) array.pop()
    console.log(str, array.join(''), character)
    return array.join('')

}

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
            const remaining = values.filter(
                value => property(value).substring(0, nextIndex) == prefix
            )

            if (remaining.length >= minGroupCount && prefix.length >= minPrefixLength) {

                const groupName = delimiters.reduce((prefix, delimiter) => trimEnd(prefix, delimiter), prefix)
                groupings.grouped[groupName] = remaining
                groupings.groupCount++
                remaining.forEach(value => processed[property(value)] = value)
                break
            }
        }

        values = values.filter(value => !(property(value) in processed))
    }

    return groupings
}

module.exports = {
    execute,
    groupSimilar
}