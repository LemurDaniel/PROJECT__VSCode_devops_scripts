const process = require('child_process');

function execute(command, args = []) {

    return new Promise((resolve, reject) => {
        command = args.reduce((acc, arg) => `${acc} ${arg}`, command)
        process.exec(command, (err, stdout, stderr) => {
            if (err)
                reject(err)
            else if (stderr)
                reject(stderr)
            else
                resolve(stdout)
        })
    })

}


function groupSimilar(values, minGroupCount, minPrefixLength, property = value => value) {

    const delimiters = ['-', '_', ' ', '/', '.']
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
                .reduce((acc, v) => Math.min(acc, v + i + 1), 999)

            if (nextIndex == 999 && i > 0)
                continue
            else if (i == 0) {
                processed[initial] = values[0]
                groupings.ungrouped.push(values[0])
                break
            }

            console.log(processed)
            //console.log(nextIndex, initial.substring(0, nextIndex))
            const prefix = initial.substring(0, nextIndex)
            const remaining = values.filter(
                value => property(value).substring(0, nextIndex) == prefix
            )

            if (remaining.length >= minGroupCount && prefix.length >= minPrefixLength) {

                groupings.grouped[prefix] = remaining
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