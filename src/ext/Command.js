const EventEmitter = require('events')

/**
 * Command emitter for ifunny client's
 * Works similarly to a normal EventEmitter,
 * but registers every listener as a command for it's client
 * @extends {EventEmitter}
 */
class Command extends EventEmitter {
    constructor(client) {
        super()
        this.client = client
    }

    /**
     * Register a listener, and add it's name to the list of client Commands
     * @param  {String}     type     Command name to be searched for following a prefix
     * @param  {Function}   listener Function to be executed when this command is called
     * @param  {String}     help     Help string for this command
     */
    on(type, listener, help) {
        super.on(type, listener)
        this.client._commands[type] = help || null
    }
}

module.exports = Command
