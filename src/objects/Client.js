const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')
const { homedir } = require('os')

/**
 * iFunny Client object, representing a logged in or guest user
 * @extends {EventEmitter}
 * @param {Object}                                      opts                            Optional parameters
 * @param {Number}                                      opts.paginated_size=25          Size of each paginated request
 * @param {Number}                                      opts.notification_interval=5000 Time in milliseconds between checking for notifications
 * @param {String|Set<String>|Array<String>|Function}   opts.prefix=null
 * Prefix that this bot should use for commands
 * Prefix can be a single String, Set/Array of strings, or a function that returns and of those.
 * If the prefix is a callable function, it will be called with the single argument of the message that is being evauluated
 * @param {Boolean}                                     opts.reconnect=false            Reconnect to the websocket after it's closed?
 */
class Client extends EventEmitter {
    constructor(opts = {}) {
        super()
        // add proto methods
        require('./client_proto')

        // read-only implied private data
        this._client_id = 'MsOIJ39Q28'
        this._client_secret = 'PTDc3H8a)Vi=UYap'
        this._user_agent = 'iFunny/5.43.1(1117828) Android/5.0.2 (samsung; SCH-R530U; samsung)'

        // stored values that methods will update
        this._update = false
        this._handler = null
        this._socket = null
        this._command = null
        this._event = null
        this._commands = {}
        this._object_payload = {}
        this._sendbird_session_key = null
        this._req_id = parseInt(Date.now() + (Math.random() * 1000000))

        // optional property defaults
        this._prefix = opts.prefix || null
        this._reconnect = opts.reconnect || false
        this.paginated_size = opts.paginated_size || 25
        this.notification_interval = opts.notification_interval || 5000
        this.socket_connected = false

        // public values
        this.authorized = false
        this.url = `${this.api}/account`

        // Make sure that our config file exists and use it
        if (!fs.existsSync(`${homedir()}/.ifunnyjs`)) {
            fs.mkdirSync(`${homedir()}/.ifunnyjs`)
        }

        this._config_path = `${homedir()}/.ifunnyjs/config.json`
    }

    // methods

    // internal methods

    async handle_message(key, data) {
        this.handler.handle_message(key, data)
    }

    async resolve_command(message) {
        if (!this._prefix) {
            return null
        }

        let slice = await this.prefix_slice(message)

        if (!slice) {
            return null
        }

        let content = await message.content
        let c_name = content.split(" ")[0].slice(slice)
        let args = content.split(" ")
            .slice(1)

        if (this._commands[c_name] !== undefined) {
            this.command.emit(c_name, message, args)
            return c_name
        }

        return null
    }

    command_help(command) {
        return this._commands[command]
    }

    // Determine if a message starts with a possible prefix
    // Return it's length if so
    // Return null otherwise
    async prefix_slice(message) {
        let prefix = this._prefix
        let content = await message.content

        if (typeof(this._prefix) === 'function') {
            prefix = await this._prefix(message)
        }

        if (typeof(prefix) === 'string') {
            prefix = new Set([prefix])
        } else if (typeof(prefix) === 'object') {
            prefix = new Set(prefix)
        }

        for (let p of prefix) {
            if (content.startsWith(p)) {
                return p.length
            }
        }

        return null
    }

    // Forward raw data to send to this websocket
    async send_to_socket(data) {
        await this.socket.send(data)
    }

    /**
     * Clear this client's config and wipe the config file
     * @return {Promise<Object>} this Clients config
     */
    async clear_config() {
        this._config = this.config = {}
        return this.config
    }

    /**
     * Get some value from this objects own internal JSON state
     * @param  {String}  key      key to query
     * @param  {*}  fallback=null fallback value, if no value is found for key
     * @return {Promise<*>}       retrieved data
     */
    async get(key, fallback = null) {
        let found = this._object_payload[key]

        if (found != undefined && !this._update) {
            this._update = false
            return found
        }

        this._update = false
        let response = await axios({
            method: 'get',
            url: this.url,
            headers: await this.headers
        })

        this._object_payload = response.data.data
        return this._object_payload[key] || fallback
    }

    on(type, callback) {
        super.on(type, callback)

        switch (type) {
            case 'notification':
                this.listen_for_notifications()
                break
            default:
                return
        }
    }

    /**
     * Event emitted when an unread notification is present
     * @event Client#notification
     */
    async listen_for_notifications(interval) {
        setInterval(async () => {
            for await (let note of this.unread_notifications) {
                this.emit('notification', note.value)
            }

        }, interval || this.notification_interval)
    }

    // generators

    /**
     * Generator iterating this logged in user's notifications
     * @type {Promise<Generator<Notification>>}
     */
    get notifications() {
        return methods.paginated_generator(this.notifications_paginated, { instance: this })
    }

    /**
     * Generator iterating the guests of this client and their visit time
     * @type {Promise<Generator<Object>>}
     */
    get guests() {
        return methods.paginated_generator(this.user_guests_paginated, { instance: this, user: this.id_sync })
    }

    /**
     * Generator iterating this logged un user's unread notifications
     * @type {Promise<Generator<Notification>>}
     */
    get unread_notifications() {
        return (async function*(instance) {
            let gen = instance.notifications

            for (let count = await instance.unread_notification_count; count > 0; count--) {
                yield gen.next()
            }
        })(this)
    }

    /**
     * Generator iterating through the subscribers of this client
     * @type {Promise<Generator<User>>}
     */
    get subscribers() {
        return methods.paginated_generator(this.user_subscribers_paginated, { instance: this, user: this.id_sync })
    }

    /**
     * Generator iterating through the subscriptions of this client
     * @type {Promise<Generator<User>>}
     */
    get subscriptions() {
        return methods.paginated_generator(this.user_subscriptions_paginated, { instance: this, user: this.id_sync })
    }

    /**
     * Generator iterating through the subscriptions of this client
     * @type {Promise<Generator<Post>>}
     */
    get timeline() {
        return methods.paginated_generator(this.user_timeline_paginated, { instance: this, user: this.id_sync })
    }

    /**
     * Generator iterating through the active bans of this client
     * @type {Promise<Generator<Ban>>}
     */
    get bans() {
        return methods.paginated_generator(this.user_bans_paginated, { instance: this, user: this.id_sync })
    }

    /**
     * Generator iterating through logged in users read posts
     * @type {Promise<Generator<Post>>}
     */
    get reads() {
        return methods.paginated_generator(this.reads_paginated, { instance: this })
    }

    /**
     * Alias for `Client.reads`
     * @type {Promise<Generator<Post>>}
     */
    get views() {
        return this.reads
    }

    /**
     * Generator iterating through collective posts
     * @type {Promise<Generator<Post>>}
     */
    get collective() {
        return methods.paginated_generator(this.collective_paginated, { instance: this })
    }

    /**
     * Generator iterating through featured posts
     * @type {Promise<Generator<Post>>}
     */
    get features() {
        return methods.paginated_generator(this.features_paginated, { instance: this })
    }

    /**
     * Generator iterating through weekly digests
     * @type {Promise<Generator<Digest>>}
     */
    get digests() {
        return methods.paginated_generator(this.digests_paginated, { instance: this })
    }

    /**
     * Generator iterating through featured channels
     * @type {Promise<Generator<Channel>>}
     */
    get channels() {
        return (async function*(instance) {
            let Channel = require('./Channel')
            let response = await axios({
                method: 'get',
                url: `${instance.api}/channels`,
                headers: await instance.headers
            })

            for (let item of response.data.data.channels.items) {
                if (item.id != 'latest_digest') {
                    yield new Channel(item.id, { client: instance, data: item })
                }
            }
        })(this)
    }

    /**
     * Generator iterating through chats this logged in client is in
     * @type {Promise<Generator<Chat>>}
     */
    get chats() {
        return methods.paginated_generator(this.chats_paginated, { instance: this })
    }

    // getters

    get user() {
        return (async () => {
            let User = require('./User')
            return new User(await this.id, { client: this })
        })()
    }

    get next_req_id() {
        return (this.req_id++)
    }

    /**
     * This clients websocket hadnler
     * If none has been created one will be
     * created when this value is requested
     * @type {Promise<Handler>}
     */
    get handler() {
        if (!this._handler) {
            let Handler = require('../ext/Handler')
            this._handler = new Handler(this)
        }

        return this._handler
    }

    /**
     * This clients websocket
     * If none has been created one will be
     * created when this value is requested
     * @type {Promise<Socket>}
     */
    get socket() {
        if (!this._socket) {
            let Socket = require('../ext/Socket')
            this._socket = new Socket(this)
        }

        return this._socket
    }

    /**
     * This clients command emitter
     * If none has been created one will be
     * created when this value is requested
     * @type {Promise<EventEmitter>}
     */
    get command() {
        if (!this._command) {
            let Command = require('../ext/Command')
            this._command = new Command(this)
        }

        return this._command
    }

    /**
     * iFunny api url
     * @type {Promise<String>}
     */
    get api() {
        return 'https://api.ifunny.mobi/v4'
    }

    /**
     * sendbird api url
     * @type {Promise<String>}
     */
    get sendbird_api() {
        return 'https://api-us-1.sendbird.com/v3'
    }

    /**
     * iFunny basic auth token
     * If none is stored in this client's config, one will be generated
     * @type {Promise<String>}
     */
    get basic_token() {
        return (async () => {

            if ((await this.config)
                .basic_token) {
                return (await this.config)
                    .basic_token
            }

            let hex = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
            let hex_array = []
            let range = hex.length

            for (let _ of Array(72)) {
                hex_array.push(hex[Math.floor(Math.random() * range)])
            }

            let hex_String = hex_array.join('')
            let hex_id = `${hex_String}_${this._client_id}`
            let hash_decoded = `${hex_String}:${this._client_id}:${this._client_secret}`
            let hash_encoded = sha1(hash_decoded)
            let auth = Buffer.from(`${hex_id}:${hash_encoded}`)
                .toString('base64')

            this._config.basic_token = auth
            this.config = this._config

            return auth
        })()

    }

    /**
     * iFunny headers, needed for all requests
     * Will use which appropriate authentication is available
     * @type {Promise<Object>}
     */
    get headers() {
        return (async () => {
            return {
                'User-Agent': this._user_agent,
                'Authorization': this._token ? `Bearer ${this._token}` : `Basic ${await this.basic_token}`,
                'Ifunny-Project-Id': 'iFunny'
            }
        })()
    }

    /**
     * Sendbird headers, needed for all sendbird requests
     * @type {Promise<Object>}
     */
    get sendbird_headers() {
        return (async () => {
            return {
                "User-Agent": "jand/3.096",
                "Session-Key": await this.sendbird_session_key
            }
        })()
    }

    /**
     * Sendbird session key, needed
     * to talk to iFunny's websocket
     * @type {Promise<String>}
     */
    get sendbird_session_key() {
        return (async () => {
            return this._sendbird_session_key
        })()
    }

    /**
     * Update this clients session key
     * @type {Promise<String>}
     */
    set sendbird_session_key(value) {
        this._sendbird_session_key = value
    }

    /**
     * This objects config, loaded from and written to a json file
     * @type {Promise<Object>}
     */
    get config() {
        return (async () => {

            if (!this._config) {

                if (!fs.existsSync(this._config_path)) {
                    fs.writeFileSync(this._config_path, '{}')
                }

                this._config = JSON.parse(fs.readFileSync(this._config_path))
            }

            return this._config
        })()
    }

    /**
     * Update this clients config
     * and write it to the config file
     * @type {Promise<Object>}
     */
    set config(value) {
        if (typeof(value) !== 'object') {
            throw `value should be object, not ${typeof(value)}`
        }

        this._config = value
        fs.writeFileSync(this._config_path, JSON.stringify(value))
    }

    /**
     * Set the update flag and return this object for fetching new data
     * @type {Promise<Client>}
     */
    get fresh() {
        this._update = true
        return this
    }

    /**
     * This clients phone number
     * @type {Promise<String>}
     */
    get phone_number() {
        return this.get('phone')
    }

    get messenger_token_sync() {
        return this._object_payload.messenger_token
    }

    /**
     * This clients messenger token
     * Used to start a sendbird connection, but should be replaced
     * when a new one is given by the connection
     * @type {Promise<String>}
     */
    get messenger_token() {
        return (async () => {
            return this.messenger_token_sync
        })()
    }

    get id_sync() {
        return this._object_payload.id
    }

    /**
     * This clients messenger token
     * Used to start a sendbird connection, but should be replaced
     * when a new one is given by the connection
     * @type {Promise<String>}
     */
    get id() {
        return (async () => {
            return this.id_sync
        })()
    }

    /**
     * Has this client started using chat before?
     * @type {Promise<Boolean>}
     */
    get is_chat_active() {
        return this.get('messenger_active')
    }

    /**
     * Is this client blocked from using chat?
     * @type {Promise<Boolean>}
     */
    get is_blocked_in_chat() {
        return this.get('is_blocked_in_messenger')
    }

    /**
     * Is safe mode enabled for this client?
     * @type {Promise<Boolean>}
     */
    get is_safe_mode_enabled() {
        return this.get('safe_mode')
    }

    /**
     * Is this client an iFunny moderator?
     * @type {Promise<Boolean>}
     */
    get is_moderator() {
        return this.get('is_moderator')
    }

    /**
     * Is this client an iFunny team member?
     * @type {Promise<Boolean>}
     */
    get is_ifunny_team_member() {
        return this.get('is_ifunny_team_member')
    }

    /**
     * Is this client a verified user?
     * @type {Promise<Boolean>}
     */
    get is_verified() {
        return this.get('is_verified')
    }

    /**
     * Is this client banned?
     * @type {Promise<Boolean>}
     */
    get is_banned() {
        return this.get('is_banned')
    }

    /**
     * Is this client deactivated?
     * @type {Promise<Boolean>}
     */
    get is_deactivated() {
        return this.get('is_deleted')
    }

    /**
     * Is this client private?
     * @type {Promise<Boolean>}
     */
    get is_private() {
        return this.get('is_private')
    }

    /**
     * This user's messaging privacy setting
     *
     * `public` allows new messages from any user
     *
     * `subscribers` allows new messages from users who a subscription of this user
     *
     * `closed` allows no messaging initiation on this user
     * @type {Promise<String>}
     */
    get chat_privacy() {
        return this.get('messaging_privacy_status') === 1
    }

    /**
     * Does this client have unnotified bans?
     * @type {Promise<Boolean>}
     */
    get has_unnotified_bans() {
        return this.get('have_unnotified_bans')
    }

    /**
     * Does this client have unnotified strikes?
     * @type {Promise<Boolean>}
     */
    get has_unnotified_strikes() {
        return this.get('have_unnotified_strikes')
    }

    /**
     * Does this client have unnotified achievements?
     * @type {Promise<Boolean>}
     */
    get has_unnotified_achievements() {
        return this.get('have_unnotified_achievements')
    }

    /**
     * Does this client have notifications of another category?
     * @type {Promise<Boolean>}
     */
    get has_unnotifieds() {
        return this.get('have_unnotifieds')
    }

    /**
     * Does this client need to go through account setup?
     * @type {Promise<Boolean>}
     */
    get needs_account_setup() {
        return this.get('need_account_setup')
    }

    /**
     * Sharable web url to this clients account
     * @type {Promise<String>}
     */
    get web_url() {
        return this.get('web_url')
    }

    /**
     * This clients registered email address
     * @type {Promise<String>}
     */
    get email() {
        return this.get('email')
    }

    /**
     * This clients nick
     * @type {Promise<String>}
     */
    get nick() {
        return this.get('nick')
    }

    /**
     * This clients about
     * @type {Promise<String>}
     */
    get about() {
        return this.get('about')
    }

    /**
     * Number of unread notifications
     * @type {Number}
     */
    get unread_notification_count() {
        return (async () => {
            let response = await axios({
                method: 'get',
                url: `${this.api}/counters`,
                headers: await this.headers
            })
            return response.data.data.news
        })()
    }
}

module.exports = Client
