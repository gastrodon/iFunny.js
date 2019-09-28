const WebSocket = require('ws')
const EventEmitter = require('events')

/**
 * Socket object, for handling iFunny websocket chat
 * @extends {EventEmitter}
 * @param {Client} client client that this socket is bound to
 */
class Socket extends EventEmitter {
    constructor(client) {
        super()
        this.socket_url = 'https://ws-us-1.sendbird.com'
        this.route = 'AFB3A55B-8275-4C1E-AEA8-309842798187'
        this.client = client
        this.connection = null
    }

    /**
     * Connect to this socket
     * @return {Promise<WebSocket>} this socket connection
     */
    async start() {
        let params = {
            dp: 'Android',
            pv: '26',
            sv: '3.0.55',
            ai: this.route,
            user_id: (await this.client.id),
            access_token: (await this.client.messenger_token)
        }
        params = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')

        this.connection = new WebSocket(`${this.socket_url}?${params}`)
        await this._associate_listeners(this.connection)
        return this.connection
    }

    /**
     * Send raw data to this connection
     * @param  {string}  data data to send
     */
    async send(data) {
        this.connection.send(data)
    }

    /**
     * Event emitted when the socket is closed, and the client is not set to auto reconnect
     * @event Client#disconnect
     * @property {Number} code websocket code for closure reason
     */
    async _associate_listeners(connection) {
        connection.on('close', async (code, reason) => {
            if( this.client._reconnect) {
                this.start()
            }
            else {
                this.client.emit('disconnect', code)
            }
        })

        connection.on('error', async (error) => {
            console.log(`unimplemented - error: ${error}`)
        })

        connection.on('message', async (data) => {
            this.client.handle_message(
                data.substring(0, 4), JSON.parse(data.substring(4))
            )
        })

        connection.on('ping', async (data) => {
            this.connection.pong(data)
        })

        connection.on('unexpected-response', async (request, response) => {
            console.log(`unimplemented - unexpected-response: ${request}, ${response}`)
        })
    }

    async _ping_interval(interval) {
        let connection = this.connection

        setInterval(function() {
            connection.ping()
        }, interval * 1000);
    }
}

module.exports = Socket
