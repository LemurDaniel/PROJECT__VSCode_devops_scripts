const utility = require('./lib/utils/utility')


utility.execute(`git branch --list --format=%(if)%(HEAD)%(then)*%(end)%(refname);%(refname:short);%(authorname)`, '.')
    .then(result => result.split('\n').filter(line => line[0] == '*').at(0))
    .then(result => result.substring(1).split(';'))
    .then(data => ({
        name: data[0],
        nameShort: data[1],
        creator: data[2]
    }))
    .then(data => console.log(data))


utility.execute(`git branch --list --format=%(refname);%(refname:short);%(authorname)`, '.')
    .then(result =>
        result.split('\n').filter(name => name.length > 0)
            .map(data => data.split(';'))
            .map(data => ({
                name: data[0],
                nameShort: data[1],
                creator: data[2]
            }))
    )
    .then(data => console.log(data))