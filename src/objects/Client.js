const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')
const { homedir } = require('os')

/**
 * iFunny Client object, representing a logged in or guest user
 * @extends {EventEmitter}
 * @param {Object}  opts                   Optional parameters
 * @param {Number}  opts.paginated_size=25 Size of each paginated request
 * @param {String}  opts.prefix=null       Prefix that this bot should use for commands
 * @param {Boolean} opts.reconnect=false   Reconnect to the websocket after it's closed?
 */
class Client extends EventEmitter {
    constructor(opts = {}) {
        super()
        this._client_id = 'MsOIJ39Q28'
        this._client_secret = 'PTDc3H8a)Vi=UYap'
        this._user_agent = 'iFunny/5.42(1117792) Android/5.0.2 (samsung; SCH-R530U; samsung)'
        this._update = false
        this._object_payload = {}
        this._handler = null
        this._socket = null
        this._sendbird_session_key = null
        this._prefix = opts.prefix || null
        this._reconnect = opts.reconnect || false
        this._commands = []
        this._reserved_events = [
            'broadcast',
            'chat_update',
            'connected',
            'invite',
            'invite_broadcast',
            'message',
            'ping',
            'read',
            'ready',
            'user_exit',
            'unknown_event'
        ]

        this.authorized = false
        this.paginated_size = opts.paginated_size || 25
        this.url = `${this.api}/account`

        // Make sure that our config file exists and use it
        if (!fs.existsSync(`${homedir()}/.ifunnyjs`)) {
            fs.mkdirSync(`${homedir()}/.ifunnyjs`)
        }

        this._config_path = `${homedir()}/.ifunnyjs/config.json`
    }

    // methods

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

    /**
     * Log into an iFunny account and authenticate this
     * @param  {String}  email      description
     * @param  {String}  password   password to the account being logged into, optional for accounts with stored bearer tokens
     * @param  {Object}  opts={}  Optional parameters
     * @param  {Boolean} opts.force bypass stored tokens?
     * @return {Promise<Client>}    this client
     * @fires login#ready
     */
    /**
     * Event emitted when this client is logged in
     * @event Client#ready
     * @property {Boolean} fresh did this login get a fresh token?
     */
    async login(email, password, opts = { force: false }) {
        /*
        Log into ifunny

        params:
            email: email to log in with
            password: password to log in with
            opts:
                force: bypass saved bearer tokens

        returns:
            this after verifying login
        */
        if (!email) {
            throw 'email is required'
        }

        if (this.config[`bearer ${email}`] && !opts.force) {
            this._token = this.config[`bearer ${email}`]

            try {
                let response = await axios({
                    method: 'get',
                    url: `${this.api}/account`,
                    headers: await this.headers
                })

                this.authorized = true
                this._object_payload = response.data.data
                this.emit('ready', false)
                return this

            } catch (error) {
                this._token = null
            }
        }

        let data = {
            'grant_type': 'password',
            'username': email,
            'password': password
        }

        data = Object.keys(data).map(key => `${key}=${data[key]}`).join('&')

        let response = await axios({
            method: 'post',
            url: `${this.api}/oauth2/token`,
            headers: (await this.headers),
            data: data
        })

        this._token = response.data.access_token
        this._config[`bearer ${email}`] = response.data.access_token
        this.config = this._config

        response = await axios({
            method: 'get',
            url: `${this.api}/account`,
            headers: await this.headers
        })

        this._object_payload = response.data.data

        this.emit('ready', true)
        return response
    }

    /**
     * Get a chunk of this logged in users notifications
     * @param  {Object}  opts={}       optional parameters
     * @param  {Number}  opts.limit=25 Number of items to fetch
     * @return {Promise<Object>}         chunk of notifications with paging info
     */
    async notifications_paginated(opts = {}) {
        let Notification = require('./Notification')
        let instance = this || opts.instance

        let data = await methods.paginated_data(`${instance.api}/news/my`, {
            limit: opts.limit || instance.paginated_size,
            key: 'news',
            prev: opts.prev,
            next: opts.next,
            headers: instance.headers
        })

        data.items = data.items.map((item) => new Notification(item))
        return data

    }

    async handle_message(key, data) {
        (await this.handler).handle_message(key, data)
    }

    /**
     * Listen for a command, and emit it's name when it is called with this prefix
     * @param  {String}  name  Command name
     */
    async listen_for_command(name) {
        if (this._reserved_events.includes(name)) {
            throw `${name} is a reserved listener`
        }

        if (this._commands.has(name)) {
            return
        }

        this._commands.add(name)
    }

    /**
     * Listen for a command, and emit it's name when it is called with this prefix
     * @param  {String|Array<String>}  name  Command name
     * @return {Promise<Client>}     This clinet instance
     */
    async listen_for(names) {
        if(typeof(names) === 'string') {
            names = new Set([names])
        }

        this._commands = new Set([...names, ...this._commands])
    }

    async resolve_command(message) {
        if(!this._prefix) {
            return null
        }

        let slice = await this.prefix_slice(message)

        if(!slice) {
            return null
        }

        let content = await message.content
        let c_name = content.split(" ")[0].slice(slice)
        let args = content.split(" ").slice(1)

        if(this._commands.has(c_name)) {
            this.emit(c_name, message, args)
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

        if(typeof(this._prefix) === 'function') {
            prefix = this._prefix(message)
        }

        if(typeof(prefix) === 'string') {
            prefix = new Set([prefix])
        }

        else if (typeof(prefix) === 'object') {
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
        await (await this.socket).send(data)
    }

    /**
     * Send a text message to a chat
     * @param  {String}       content Message content
     * @param  {Chat|String}  chat    Chat or channel_url of the chat to send this message to
     * @return {Promise<Chat|String>} Chat or channel_url, whichever was passed to the method
     */
    async send_text_message(content, chat) {
        let data = {
            'channel_url': chat.channel_url || chat,
            'message': content
        }

        this.send_to_socket(`MESG${JSON.stringify(data)}\n`)
        return chat
    }

    /**
     * Clear this client's config and wipe the config file
     * @return {Object} this Clients config
     */
    clear_config() {
        this._config = this.config = {}
        return this.config
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

    /**
     * This clients websocket hadnler
     * If none has been created one will be
     * created when this value is requested
     * @type {Handler}
     */
    get handler() {
        return (async () => {
            if (!this._handler) {
                let Handler = require('../ext/Handler')
                this._handler = new Handler(this)
            }

            return this._handler
        })()
    }

    /**
     * This clients websocket
     * If none has been created one will be
     * created when this value is requested
     * @type {Socket}
     */
    get socket() {
        return (async () => {
            if (!this._socket) {
                let Socket = require('../ext/Socket')
                this._socket = new Socket(this)
            }

            return this._socket
        })()
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

        var hex = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        var hex_array = []
        var range = hex.length

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

    get _messenger_token() {
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
            return this._messenger_token
        })()
    }

    get _id() {
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
            return this._id
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
