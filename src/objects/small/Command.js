const EventEmitter = require('events')

class Command extends EventEmitter {
    constructor(client) {
        super()
        this.client = client
    }

    on(type, listener) {
        super.on(type, listener)
        this.client._commands.add(type)
    }
}

module.exports = Command
