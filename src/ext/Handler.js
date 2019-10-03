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
        this.event = null
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
            case 'FILE':
                this.on_message(data)
                break
            case 'SYEV':
                this.on_chat_update(data)
                break
            case 'PING':
                this.on_ping(data)
                break
            case 'READ':
                this.on_read(data)
                break
            case 'BRDM':
                this.on_broadcast(data)
                break
            default:
                this.default(key, data)
        }
    }

    /**
     * Default case for handling websocket data, when the event is unknown
     * @param  {String}  key  4 character event key, per the sendbird api
     * @param  {Object}  data Data sent with the key
     */
    // /**
    //  * Event emitted when an unmatched event is encountered
    //  * @event Handler#unknown_event
    //  * @property  {String}  key  4 character event key, per the sendbird api
    //  * @property  {Object}  data Data sent with the key
    //  */
    async default (key, data) {
        // This is here as a debug untill the websocket is "fully" implemented
        // I don't think I'm missing anything, but I might be
        //
        // There seems to be a ratelimit error key, needs testing
        this.emit('unknown_event', key, data)
    }

    /**
     * Handle a websocket connection acknowledgement
     * @param {Object} raw data from the socket
     */
    /**
     * Event emitted when the socket conneciton is acknowledged by sendbird
     * And the websocket is ready to use
     * @event Handler#connect
     */
    async on_connect(data) {
        this.client.sendbird_session_key = data.key
        this.client.socket_connected = true
        this.emit('connect')
        let socket = this.client.socket
        socket._ping_interval(data.ping_interval)
    }

    /**
     * Handle a text message
     * @param  {Object}  raw data from the socket
     */
    /**
     * Event emitted when a chat message is recieved that is not from the client
     * @event Handler#message
     * @property {Message} message     message recieved
     */
    /**
     * Event emitted when a chat message is recieved that was sent by this client
     * @event Handler#own_message
     * @property {Message} message     message recieved
     */
    async on_message(data) {
        let message = new Message(data.msg_id, data.channel_url, { client: this.client, data: data })

        if (data.user.name == await (await this.client).nick) {
            return this.emit('own_message', message)
        }

        message.invoked = await this.client.resolve_command(message)
        this.emit('message', message)
    }

    async on_chat_update(data) {
        switch (data.cat) {
            case 10020:
                this.on_invite_broadcast(data)
                break
            case 10000:
                // user_join is implemented by on_broadcast
                // this.on_user_join(data)
                break
            case 10001:
                // user_exit is implemented by on_broadcast
                // this.on_user_exit(data)
                break
            default:
                this.chat_update(data)
        }
    }

    /**
     * Event emitted when an invite is broadcast for a chat
     * @event Handler#invite_broadcast
     * @property {Invite} invite invite that was broadcast
     */
    /**
     * Event emitted when the client is invited to a chat
     * @event Handler#invite
     * @property {Invite} invite invite that was broadcast
     */
    async on_invite_broadcast(data) {
        let Invite = require('../objects/Invite')
        let client = await this.client
        let invitees = data.data.invitees.map(it => it.user_id)
        let invite = new Invite(data, { client: this.client })

        if (invitees.some(it => it == client.id_sync)) {
            this.emit('invite', invite)
        } else {
            this.emit('invite_broadcast', invite)
        }

    }

    /**
     * Event emitted when the socket pings us
     * @event Handler#ping
     */
    async ping(data) {
        this.client.socket.pong(data)
        this.emit('ping')
    }

    /**
     * Event emitted when a chat was marked as read
     * @event Handler#read
     * @property {ChatUser} user    user who marked this chat as read
     * @property {Chat}     chat    chat that was marked as read
     */
    async on_read(data) {
        let chat = new Chat(data.channel_url, { client: this.client })
        this.emit(
            'read',
            new ChatUser(data.user.guest_id, chat, { client: this.client }),
            chat
        )
    }

    /**
     * Event emitted when a generic broadcast is recieved
     * @event Handler#broadcast
     * @property {data} data sent with the BRDM broadcast key
     */
    async on_broadcast(data) {
        let type = JSON.parse(data.data).type
        switch (type) {
            case 'CHANNEL_CHANGE':
                this.chat_update(data)
                break;
            case 'USER_JOIN':
                this.user_join(data)
                break;
            case 'USER_LEAVE':
                this.user_exit(data)
                break;
            default:
                // this.emit('broadcast', data)
        }

    }

    /**
     * Event emitted when a chat is changed in some way
     * @event Handler#chat_update
     * @property {Chat}   chat      chat that was updated
     */
    async chat_update(data) {
        let Chat = require('../objects/Chat')
        let chat = new Chat(data.channel_url, { client: this.client })
        this.emit(`chat_update`, chat)
    }

    /**
     * Event emitted when a user does join a chat
     * @event Handler#user_exit
     * @property {Object} user user who did join
     * @property {Object} chat chat that this user did join
     * @property {Object|Null} inviter user who did invite this user
     */
    async user_join(data) {
        let Chat = require('../objects/Chat')
        let ChatUser = require('../objects/ChatUser')
        let chat = new Chat(data.channel_url, { client: this.client })
        let meta = JSON.parse(data.data)
        let joined = meta.users.map(it => new ChatUser(it.user_id, chat, { client: this.client }))
        let inviter = null

        if (meta.inviter) {
            inviter = new ChatUser(meta.inviter.user_id, chat, { client: this.client })
        }

        for (let user of joined) {
            this.emit('user_join', user, chat, inviter)
        }
    }

    /**
     * Event emitted when a user does exit a chat
     * @event Handler#user_exit
     * @property {Object} user user who did exit
     * @property {Object} chat chat that this user did exit
     */
    async user_exit(data) {
        let Chat = require('../objects/Chat')
        let ChatUser = require('../objects/ChatUser')
        let chat = new Chat(data.channel_url, { client: this.client })
        let meta = JSON.parse(data.data)
        let left = meta.users.map(it => new ChatUser(it.user_id, chat, { client: this.client }))

        for (let user of left) {
            this.emit('user_exit', user, chat)
        }
    }
}

module.exports = Handler
