'use strict'
const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

const methods = require('../utils/methods')

require('axios-debug-log')

const {
    homedir
} = require('os')

/**
 *  Base Client for all constructs
 *  @extends {EventEmitter}
 */

class Client extends EventEmitter {
    #client_id
    #client_secret
    #user_agent
    #config_path

    #token
    #config
    #user
    #id
    constructor(opts = {}) {
        /*
        iFunny Client object, representing a logged in user or guest

        params:
            opts:
                paginated_size: default pagination size
        */
        super()
        this.#client_id = 'MsOIJ39Q28'
        this.#client_secret = 'PTDc3H8a)Vi=UYap'
        this.#user_agent = 'iFunny/5.42(1117792) Android/5.0.2 (samsung; SCH-R530U; samsung)'

        // Make sure that our config file exists and use it
        if (!fs.existsSync(`${homedir()}/.ifunnyjs`)) {
            fs.mkdirSync(`${homedir()}/.ifunnyjs`)
        }

        this.#config_path = `${homedir()}/.ifunnyjs/config.json`
        this.paginated_size = opts.paginated_size || 25
        this.authorized = false
    }

    get api() {
        return 'https://api.ifunny.mobi/v4'
    }

    get sendbird_api() {
        return 'https://api-us-1.sendbird.com/v3'
    }

    get captcha_api() {
        return 'https://2captcha.com'
    }

    get basic_token() {
        if (this.config['basic_token']) {
            return this.config['basic_token']
        }

        var hex = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        var hex_array = []
        var range = hex.length

        for (let _ of Array(64)) {
            hex_array.push(hex[Math.floor(Math.random() * range)])
        }

        const hex_string = hex_array.join('')
        const hex_id = `${hex_string}_${this.#client_id}`
        const hash_decoded = `${hex_string}:${this.#client_id}:${this.#client_secret}`
        const hash_encoded = sha1(hash_decoded)
        const auth = Buffer.from(`${hex_id}:${hash_encoded}`).toString('base64')

        this.#config['basic_token'] = auth
        this.config = this.#config

        return auth

    }

    get headers() {
        var _headers = {
            'User-Agent': this.#user_agent,
            'Authorization': this.#token ? `Bearer ${this.#token}` : `Basic ${this.basic_token}`
        }

        return _headers
    }

    get config() {
        if (!this.#config) {

            if (!fs.existsSync(this.#config_path)) {
                fs.writeFileSync(this.#config_path, '{}')
            }

            this.#config = JSON.parse(fs.readFileSync(this.#config_path))
        }

        return this.#config
    }

    set config(value) {
        if (typeof(value) !== 'object') {
            throw `value should be object, not ${typeof(value)}`
        }

        this.#config = value
        fs.writeFileSync(this.#config_path, JSON.stringify(value))
    }

    clear_config() {
        this.#config = this.config = {}
    }

    // public methods
    async login(email, password, opts = {force: false}) {
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
        return new Promise(async (resolve, reject) => {
            if (!email) {
                reject('email is required')
            }

            if (this.config[`bearer ${email}`] && !opts.force) {
                this.#token = this.config[`bearer ${email}`]

                let flag = false
                let response = await axios({
                    method: 'get',
                    url: `${this.api}/account`,
                    headers: this.headers
                }).catch((error) =>{flag = true})

                if (!flag) {
                    this.authorized = true
                    resolve(this)
                    return
                }
                else {
                    this.#token = null
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
            }).catch((error) => {
                reject(error.response.data)
                return
            })
            this.#token = response.data.access_token
            this.#config[`bearer ${email}`] = response.data.access_token
            this.config = this.#config

            resolve(response)
            return
        })
    }

    async notifications_paginated(opts = {}) {
        /*
        paginated notifications

        params:
            opts:
                limit: pagination chunk size
                prev: prev page token
                next: next page token
        */

        return new Promise(async (resolve, reject) => {
            data = methods.paginated_data(`${this.api}/news/my`, {
                limit: opts.limit || this.paginated_size, key: 'news',
                prev: opts.prev, next: opts.next, headers: this.headers
            })

            return data['items']
        })
    }

}

module.exports = Client
