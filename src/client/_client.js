'use strict'
const EventEmitter = require('events')
const fs = require('fs')
const methods = require('../AxiosAPI/client')

/**
 *  Base Client for all constructs
 *  @extends {EventEmitter}
 */

class Client {
    constructor(options) {
        /*
        options, for optional parameters on construction

        options.config_file -> json file location for saving tokens
        */
        this.authenticated = false

        this.__config_file = options.config_file ? options.config_file : "absolute path"
        this.__user = null
        this__id = null
    }
}

console.log(Client)

module.exports = Client
