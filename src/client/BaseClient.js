"use strict";
const EventEmitter = require('events')
const methods = require('../AxiosAPI/client')

/**
 *  Base Client for all constructs
 *  @extends {EventEmitter}
 */

class Client extends EventEmitter {
    constructor() {
        super()
        }

        

    async login(username, password, agent) {

        const token1 = await methods.token(username, password)

        this.token = token1

        this.agent = agent

        this.emit("ready", token1)

        setInterval(function(){}, 5000)

        return token1
    }

    async post(obj) {

        const data = await require('../AxiosAPI/post').post(obj, this.agent, this.token)
        return data

    }
}

module.exports = Client