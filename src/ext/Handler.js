const EventEmitter = require('events')
const Message = require('../objects/Message')
const Chat = require('../objects/Chat')
const ChatUser = require('../objects/ChatUser')

/**
 * Handler object, to handle iFunny websocket events
 * @extends {EventEmitter}
 * @param {Client} client client that this handler is bound to
 */
class Handler extends EventEmitter {
    constructor(client) {
        super()
        this.client = client

        // TODO: this
        this.channel_update_codes = {
            10020: this.on_invite,
            10001: this.on_user_exit,
            10000: this.on_user_join
        }
    }

    /**
     * Handle a key : json parsed websocket message
     * and call a method based on it's 4 character prefix
     * @param  {String}  key  socket message key
     * @param  {Object}  data socket json value
     */
    async handle_message(key, data) {
        switch (key) {
            case 'LOGI':
                this.on_connect(data)
                break
            case 'MESG':
                this.on_message(data)
                break
            case 'SYEV':
                this.on_channel_update(data)
                break
            case 'FILE':
                this.on_file(data)
                break
            case 'PING':
                this.on_ping(data)
                break
            case 'READ':
                this.on_read(data)
                break
            default:
                this.default(key, data)
        }
    }

    async default (key, data) {
        // This is here as a debug untill the websocket is "fully" implemented
        // I don't think I'm missing anything, but I might be
        //
        // There seems to be a ratelimit error key, needs testing
        console.log(`unmatched ${key}`)
    }

    /**
     * Handle a websocket connection acknowledgement
     * @param {Object} raw data from the socket
     */
    /**
     * Event emitted when the socket conneciton is acknowledged by sendbird
     * And the websocket is ready to use
     * @event Client#connected
     */
    async on_connect(data) {
        this.client.sendbird_session_key = data.key
        console.log(this.client.sendbird_headers)
        this.client.emit('connected')
        let socket = await this.client.socket
        socket._ping_interval(data.ping_interval)
    }

    /**
     * Handle a text message
     * @param  {Object}  raw data from the socket
     */
    /**
     * Event emitted when a chat message is recieved
     * @event Client#message
     * @property {Message} message     message recieved
     */
    async on_message(data) {
        if (data.user.name == await (await this.client).nick) {
            return
        }

        this.client.emit('message', new Message(data.msg_id, data.channel_url, { client: this.client, data: data }))
    }

    async on_channel_update(data) {
        // TODO: channel udpates
    }

    async on_file(data) {
        // TODO: objectify into the Message object
        // this.client.emit('file', data)
    }

    /**
     * Handle a ping and pong the server
     * @param  {Object}  raw data from the socket
     */
    /**
     * Event emitted when the socket pings us
     * @event Client#ping
     */
    async ping(data) {
        this.client.socket.pong(data)
        this.client.emit('ping')
    }

    /**
     * Handle a channel being read by a user
     * @param  {Object}  raw data from the socket
     */
    /**
     * Event emitted when a channel was marked as read
     * @event Client#read
     * @property {ChatUser} user    user who marked this chat as read
     * @property {Chat}     chat    chat that was marked as read
     */
    async on_read(data) {
        let chat = new Chat(data.channel_url, { client: this.client })
        this.client.emit(
            'read',
            new ChatUser(data.user.guest_id, chat, { client: this.client }),
            chat
        )
    }
}

module.exports = Handler
