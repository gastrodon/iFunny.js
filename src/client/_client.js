'use strict'
const EventEmitter = require('events')

const axios = require('axios')
const fs = require('fs')
const sha1 = require('js-sha1')

require("axios-debug-log")

const {homedir} = require('os')

/**
 *  Base Client for all constructs
 *  @extends {EventEmitter}
 */

class Client extends EventEmitter{
    constructor(options) {
        /*
        iFunny Client object, representing a logged in user
        params:
            options: for optional parameters on construction
                options.config_path: json file path for saving tokens
        */
        super()

        // Make sure that our config file exists

        if(!fs.existsSync(`${homedir()}/.ifunnyjs`)) {
            fs.mkdirSync(`${homedir()}/.ifunnyjs`)
        }

        options = options ? options : {}

        // auth setup
        this.__bearer = null

        // config file setup
        this.__config_path = options.config_path ? options.config_path : `${homedir()}/.ifunnyjs/config.json`
        this.__config = null

        this.__user = null
        this.__id = null
    }

    // const getters

    get api() {
        return 'https://api.ifunny.mobi/v4'
    }

    get sendbird_api() {
        return 'https://api-us-1.sendbird.com/v3'
    }

    get client_id() {
        return 'MsOIJ39Q28'
    }

    get client_secret() {
        return 'PTDc3H8a)Vi=UYap'
    }

    get user_agent() {
        return 'iFunny/5.38.1(1117733) Android/9 (OnePlus; ONEPLUS A6013; OnePlus)'
    }

    // authentication getters

    get basic_auth() {
        if(this.config['basic_auth']) {
            return this.config['basic_auth']
        }

        var hex = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        var hex_array = []
        var range = hex.length

        for (let _ of Array(72)) {
            hex_array.push(hex[Math.floor(Math.random() * range)])
        }

        const hex_string = hex_array.join('')
        const hex_id = `${hex_string}_${this.client_id}`
        const hash_decoded = `${hex_string}:${this.client_id}:${this.client_secret}`
        const hash_encoded = sha1(hash_decoded)
        const auth = Buffer.from(`${hex_id}:${hash_encoded}`).toString('base64')

        this.__config['basic_auth'] = auth
        this.config = this.__config

        return auth

    }

    get headers() {
        var _headers = {
            "User-Agent":   this.user_agent,
            "Content-Type": 'application/x-www-form-urlencoded'
        }

        if(this.__bearer) {
            _headers['Authorization'] = `Bearer ${this.__bearer}`
        } else {
            _headers['Authorization'] = `Basic ${this.basic_auth}`
        }

        return _headers
    }

    // config caching

    get config() {
        if(!this.__config) {

            if(!fs.existsSync(this.__config_path)) {
                fs.writeFileSync(this.__config_path, '{}')
            }

            this.__config = JSON.parse(fs.readFileSync(this.__config_path))
        }

        return this.__config
    }

    set config(value) {
        if(typeof(value) !== 'object') {
            throw `value should be object, not ${typeof(value)}`
        }

        this.__config = value
        fs.writeFileSync(this.__config_path, JSON.stringify(value))
    }

    clear_config() {
        this.__config = this.config = {}
    }

    // public methods

    async login(email, password, force) {
        /*
        Log into ifunny

        params:
            email: email to log in with
            password: password to log in with
            force: bypass saved bearer tokens

        emits:
            login: (this) bearer was either fetched from the server or local caching
            api_error: the api told us something wacky
        */

        if(!email) {
            throw 'Email is required to login'
        }

        if(this.config[`bearer_${email}`] && !force){
            this.__bearer = this.config[`bearer_${email}`]
            this.emit("login", this)
            return
        }

        let data = {
            'grant_type': 'password',
            'username': email,
            'password': password
        }
        data = Object.keys(data).map(key => `${key}=${data[key]}`).join('&')

        axios({
            method:     'post',
            url:        `${this.api}/oauth2/token`,
            data:       data,
            headers:    this.headers}
        ).then((response) => {
            this.__bearer = response.data['access_token']
            this.__config[`bearer_${email}`] = response.data['access_token']
            this.config = this.__config

            this.emit("login", this)
        }).catch((error) => {
            if(error.response.status === 429) {
                this.emit("api_timeout", this, error)
            } else if(error.response.status == 400) {
                this.emit("wrong_passord", this, error)
            } else {
                this.emit("api_error", this, error)
            }
        })
    }

}

module.exports = Client
