const EventEmitter = require('events')
const axios = require('axios')
const {homedir} = require('os')

const Client = require('./Client')

class FreshObject extends EventEmitter {
    static api = 'https://api.ifunny.mobi/v4'
    static sendbird_api = 'https://api-us-1.sendbird.com/v3'

    #object_payload = undefined
    #update = undefined

    constructor(id, opts = {}) {
        /*
        Fresh Object constructor, for objects that can fetch fresh info about themselves

        params:
            id: id of this object, least amout of information needed to get data
            opts:
                client: Client that this object should be bound to
                data: data payload that can be read from before needing to make a request for fresh data
        */
        super()
        if (id === undefined) {
            throw new TypeError('id should be a string or number')
        }

        this.client = opts.client || new Client
        this.id = id
        this.paginated_size = this.client.paginated_size
        this.url = undefined

        this.#object_payload = opts.data || {}
        this.#update = false
    }

    async get(key) {
        return new Promise(async (resolve, reject) => {
            let found = this.#object_payload[key]

            if (found != undefined && !this.#update) {
                return resolve(found)
            }

            let response = await axios({
                method: 'get',
                url: this.url,
                headers: this.headers
            }).catch((error) => {
                return reject(error.response)
            })
            console.log(response.data.data)

            this.#object_payload = response.data.data
            return resolve(this.#object_payload[key])
        })
    }

    get api() {
        return this.client.api
    }

    get sendbird_api() {
        return this.client.sendbird_api
    }

    get captcha_api() {
        return this.client.captcha_api
    }

    get fresh() {
        this.#update = true
        return this
    }

    get headers() {
        return this.client.headers
    }
}

module.exports = FreshObject
