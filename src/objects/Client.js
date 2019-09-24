const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')
const { homedir } = require('os')

/**
 * iFunny Client object, representing a logged in or guest user
 * @extends {EventEmitter}
 * @param {object} opts Optional properties
 * @param {number} [opts.paginated_size = 25] Size of each paginated request
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
        this.paginated_size = opts.paginated_size || 25
        this.authorized = false
    }

    /**
     * iFunny api url
     * @return {string}
     */
    get api() {
        return 'http://api.ifunny.mobi/v4'
    }

    /**
     * sendbird api url
     * @return {string}
     */
    get sendbird_api() {
        return 'http://api-us-1.sendbird.com/v3'
    }

    /**
     * iFunny basic auth token
     * If none is stored in this client's config, one will be generated
     * @return {string}
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

        const hex_string = hex_array.join('')
        const hex_id = `${hex_string}_${this._client_id}`
        const hash_decoded = `${hex_string}:${this._client_id}:${this._client_secret}`
        const hash_encoded = sha1(hash_decoded)
        const auth = Buffer.from(`${hex_id}:${hash_encoded}`).toString('base64')

        this._config.basic_token = auth
        this.config = this._config

        return auth

    }

    /**
     * iFunny headers, needed for all requests
     * Will use which appropriate authentication is available
     * @return {object}
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
     * @return {object}
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
     * @return {object} this Clients config
     */
    clear_config() {
        this._config = this.config = {}
        return this.config
    }

    // public methods

    /**
     * Log into an iFunny account and authenticate this
     * @param  {string}  email      description
     * @param  {string}  password   password to the account being logged into, optional for accounts with stored bearer tokens
     * @param  {Object}  opts = {}  Optional parameters
     * @param  {boolean} opts.force bypass stored tokens?
     * @return {Promise<Client>}    this client
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

        return response
    }

    /**
     * Get a chunk of this logged in users notifications
     * @param  {Object}  opts = {}       optional parameters
     * @param  {number}  opts.limit = 25 number of items to fetch
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

    // public generators

    /**
     * Generator iterating through logged in users notifications
     * @return {Generator<Notification>} notifications
     */
    get notifications() {
        return methods.paginated_generator(this.notifications_paginated, { instance: this })

    }

}

module.exports = Client
