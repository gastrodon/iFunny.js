const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')
const { homedir } = require('os')

/**
 * iFunny Client object, representing a logged in or guest user
 * @extends {EventEmitter}
 * @param {Object}                                      opts                   Optional parameters
 * @param {Number}                                      opts.paginated_size=25 Size of each paginated request
 * @param {String|Set<String>|Array<String>|Function}   opts.prefix=null
 * Prefix that this bot should use for commands
 * Prefix can be a single String, Set/Array of strings, or a function that returns and of those.
 * If the prefix is a callable function, it will be called with the single argument of the message that is being evauluated
 * @param {Boolean}                                     opts.reconnect=false   Reconnect to the websocket after it's closed?
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
        this._object_payload = {}
        this._sendbird_session_key = null
        this._commands = new Set()
        this._req_id = parseInt(Date.now() + (Math.random() * 1000000))

        // optional property defaults
        this._prefix = opts.prefix || null
        this._reconnect = opts.reconnect || false
        this.paginated_size = opts.paginated_size || 25

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
        let args = content.split(" ").slice(1)

        if (this._commands.has(c_name)) {
            this.command.emit(c_name, message, args)
            return c_name
        }

        return null
    }

    // Determine if a message starts with a possible prefix
    // Return it's length if so
    // Return null otherwise
    async prefix_slice(message) {
        let prefix = this._prefix
        let content = await message.content

        if (typeof(this._prefix) === 'function') {
            prefix = this._prefix(message)
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
     * @return {Object} this Clients config
     */
    clear_config() {
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

    // generators

    /**
     * Generator iterating through logged in users notifications
     * @type {Generator<Notification>}
     */
    get notifications() {
        return methods.paginated_generator(this.notifications_paginated, { instance: this })
    }

    // getters

    get next_req_id() {
        return (this.req_id++)
    }

    /**
     * This clients websocket hadnler
     * If none has been created one will be
     * created when this value is requested
     * @type {Handler}
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
     * @type {Socket}
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
     * @type {EventEmitter}
     */
    get command() {
        if (!this._command) {
            let Command = require('./small/Command')
            this._command = new Command(this)
        }

        return this._command
    }

    /**
     * iFunny api url
     * @type {String}
     */
    get api() {
        return 'https://api.ifunny.mobi/v4'
    }

    /**
     * sendbird api url
     * @type {String}
     */
    get sendbird_api() {
        return 'https://api-us-1.sendbird.com/v3'
    }

    /**
     * iFunny basic auth token
     * If none is stored in this client's config, one will be generated
     * @type {String}
     */
    get basic_token() {
        if (this.config.basic_token) {
            return this.config.basic_token
        }

        let hex = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        let hex_array = []
        let range = hex.length

        for (let _ of Array(64)) {
            hex_array.push(hex[Math.floor(Math.random() * range)])
        }

        const hex_String = hex_array.join('')
        const hex_id = `${hex_String}_${this._client_id}`
        const hash_decoded = `${hex_String}:${this._client_id}:${this._client_secret}`
        const hash_encoded = sha1(hash_decoded)
        const auth = Buffer.from(`${hex_id}:${hash_encoded}`).toString('base64')

        this._config.basic_token = auth
        this.config = this._config

        return auth

    }

    /**
     * iFunny headers, needed for all requests
     * Will use which appropriate authentication is available
     * @type {Object}
     */
    get headers() {
        return (async () => {
            return {
                'User-Agent': this._user_agent,
                'Authorization': this._token ? `Bearer ${this._token}` : `Basic ${this.basic_token}`
            }
        })()
    }

    /**
     * Sendbird headers, needed for all sendbird requests
     * @type {Object}
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
     * @type {String}
     */
    get sendbird_session_key() {
        return (async () => {
            return this._sendbird_session_key
        })()
    }

    /**
     * Update this clients session key
     * @type {String}
     */
    set sendbird_session_key(value) {
        this._sendbird_session_key = value
    }

    /**
     * This objects config, loaded from and written to a json file
     * @type {Object}
     */
    get config() {
        if (!this._config) {

            if (!fs.existsSync(this._config_path)) {
                fs.writeFileSync(this._config_path, '{}')
            }

            this._config = JSON.parse(fs.readFileSync(this._config_path))
        }

        return this._config
    }

    /**
     * Update this clients config
     * and write it to the config file
     * @type {Object}
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
     * @type {Client}
     */
    get fresh() {
        this._update = true
        return this
    }

    /**
     * This clients phone number
     * @type {String}
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
     * @type {String}
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
     * @type {String}
     */
    get id() {
        return (async () => {
            return this.id_sync
        })()
    }

    /**
     * Has this client started using chat before?
     * @type {Boolean}
     */
    get is_chat_active() {
        return this.get('messenger_active')
    }

    /**
     * Is this client blocked from using chat?
     * @type {Boolean}
     */
    get is_blocked_in_chat() {
        return this.get('is_blocked_in_messenger')
    }

    /**
     * Is safe mode enabled for this client?
     * @type {Boolean}
     */
    get is_safe_mode_enabled() {
        return this.get('safe_mode')
    }

    /**
     * Is this client an iFunny moderator?
     * @type {Boolean}
     */
    get is_moderator() {
        return this.get('is_moderator')
    }

    /**
     * Is this client an iFunny team member?
     * @type {Boolean}
     */
    get is_ifunny_team_member() {
        return this.get('is_ifunny_team_member')
    }

    /**
     * Is this client a verified user?
     * @type {Boolean}
     */
    get is_verified() {
        return this.get('is_verified')
    }

    /**
     * Is this client banned?
     * @type {Boolean}
     */
    get is_banned() {
        return this.get('is_banned')
    }

    /**
     * Is this client deactivated?
     * @type {Boolean}
     */
    get is_deactivated() {
        return this.get('is_deleted')
    }

    /**
     * Is this client private?
     * @type {Boolean}
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
     * @type {String}
     */
    get chat_privacy() {
        return this.get('messaging_privacy_status') === 1
    }

    /**
     * Does this client have unnotified bans?
     * @type {Boolean}
     */
    get has_unnotified_bans() {
        return this.get('have_unnotified_bans')
    }

    /**
     * Does this client have unnotified strikes?
     * @type {Boolean}
     */
    get has_unnotified_strikes() {
        return this.get('have_unnotified_strikes')
    }

    /**
     * Does this client have unnotified achievements?
     * @type {Boolean}
     */
    get has_unnotified_achievements() {
        return this.get('have_unnotified_achievements')
    }

    /**
     * Does this client have notifications of another category?
     * @type {Boolean}
     */
    get has_unnotifieds() {
        return this.get('have_unnotifieds')
    }

    /**
     * Does this client need to go through account setup?
     * @type {Boolean}
     */
    get needs_account_setup() {
        return this.get('need_account_setup')
    }

    /**
     * Sharable web url to this clients account
     * @type {String}
     */
    get web_url() {
        return this.get('web_url')
    }

    /**
     * This clients registered email address
     * @type {String}
     */
    get email() {
        return this.get('email')
    }

    /**
     * This clients nick
     * @type {String}
     */
    get nick() {
        return this.get('nick')
    }

    /**
     * This clients about
     * @type {String}
     */
    get about() {
        return this.get('about')
    }
}

module.exports = Client
