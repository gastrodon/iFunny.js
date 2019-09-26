const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')
const { homedir } = require('os')

/**
 * iFunny Client object, representing a logged in or guest user
 * @extends {EventEmitter}
 * @param {Object} opts                     Optional parameters
 * @param {Number} opts.paginated_size=25 Size of each paginated request
 */

class Client extends EventEmitter {
    constructor(opts = {}) {
        super()
        this._client_id = 'MsOIJ39Q28'
        this._client_secret = 'PTDc3H8a)Vi=UYap'
        this._user_agent = 'iFunny/5.42(1117792) Android/5.0.2 (samsung; SCH-R530U; samsung)'

        // Make sure that our config file exists and use it
        if (!fs.existsSync(`${homedir()}/.ifunnyjs`)) {
            fs.mkdirSync(`${homedir()}/.ifunnyjs`)
        }

        this._config_path = `${homedir()}/.ifunnyjs/config.json`
        this._update = false
        this._messenger_token = null
        this.paginated_size = opts.paginated_size || 25
        this.authorized = false

        this.ChatConnector = require("./ChatConnector.js") 

    }

    // getters

    /**
     * iFunny api url
     * @type {String}
     */
    get api() {
        return 'http://api.ifunny.mobi/v4'
    }

    /**
     * sendbird api url
     * @type {String}
     */
    get sendbird_api() {
        return 'http://api-us-1.sendbird.com/v3'
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
        var _headers = {
            'User-Agent': this._user_agent,
            'Authorization': this._token ? `Bearer ${this._token}` : `Basic ${this.basic_token}`
        }

        return _headers
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

    set config(value) {
        if (typeof(value) !== 'object') {
            throw `value should be object, not ${typeof(value)}`
        }

        this._config = value
        fs.writeFileSync(this._config_path, JSON.stringify(value))
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

    /**
     * This clients messenger token
     * Used to start a sendbird connection, but should be replaced
     * when a new one is given by the connection
     * @type {String}
     */
    get messenger_token() {
        if (!this._messenger_token) {
            this._messenger_token = this.get('messenger_token')
        }
        return this._messenger_token
    }

    /**
     * Update this clients messenger_token
     * @type {String}
     */
    set messenger_token(value) {
        this._messenger_token = value
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
        return this.get('email')
    }

    /**
     * This clients about
     * @type {String}
     */
    get about() {
        return this.get('email')
    }

    // methods

    /**
     * Log into an iFunny account and authenticate this
     * @param  {String}  email      description
     * @param  {String}  password   password to the account being logged into, optional for accounts with stored bearer tokens
     * @param  {Object}  opts = {}  Optional parameters
     * @param  {boolean} opts.force bypass stored tokens?
     * @return {Promise<Client>}    this client
     * @fires Client#ready
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
                    headers: this.headers
                })

                this.authorized = true

                /**
                 * Ready event.
                 * 
                 * @event Client#ready
                 * @type {object}
                 * @property {boolean} regen - If the token was regened or not.
                 */
                this.emit("ready", { regen: false })
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
            headers: this.headers,
            data: data
        })

        this._token = response.data.access_token
        this._config[`bearer ${email}`] = response.data.access_token
        this.config = this._config

        this.emit("ready", { regen: true })
        return response
    }

    /**
     * Get a chunk of this logged in users notifications
     * @param  {Object}  opts = {}       optional parameters
     * @param  {Number}  opts.limit = 25 Number of items to fetch
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

    // generators

    /**
     * Generator iterating through logged in users notifications
     * @type {Generator<Notification>}
     */
    get notifications() {
        return methods.paginated_generator(this.notifications_paginated, { instance: this })

    }

}

module.exports = Client
