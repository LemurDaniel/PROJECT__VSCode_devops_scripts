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

module.exports = {
    execute
}