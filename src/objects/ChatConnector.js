const ws = require("ws")
const EventEmitter = require("events")

class ChatConnection extends EventEmitter {
    constructor(client) {
        super()

        this.connection = new ws(`https://ws-us-1.sendbird.com/?p=Android&pv=26&sv=3.0.55&ai=AFB3A55B-8275-4C1E-AEA8-309842798187&key=${client.messenger_token}`)
        
    }
}

module.exports = ChatConnection