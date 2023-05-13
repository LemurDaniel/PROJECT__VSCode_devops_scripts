

module.exports = [
    require('./operation.cancel'),
    require('./operation.start'),
    require('./organization.select'),
    require('./organization.refresh'),
    require('./project.select'),
    require('./resource.browser'),
    require('./resource.create'),
    require('./resource.refresh'),
    require('./resource.settings'),
    require('./resource.rename'),
    require('./repository.download'),
    require('./repository.open'),
    require('./repository.select'),
    require('./branch.switch'),
    require('./pullrequest.create'),
    require('./pullrequest.merge')
]