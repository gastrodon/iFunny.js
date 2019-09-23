const EventEmitter = require('events')
const Client = require('./Client')
const axios = require('axios')
const { homedir } = require('os')


class FreshObject extends EventEmitter {
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

        this.client = opts.client || new Client()
        this.id = id
        this.paginated_size = this.client.paginated_size
        this.url = undefined

        this._object_payload = opts.data || {}
        this._update = false
    }

    async get(key, fallback = null) {
        console.log(this.url)
        let found = this._object_payload[key]

        if (found != undefined && !this._update) {
            return found
        }

        let response = await axios({
            method: 'get',
            url: this.url,
            headers: this.headers
        })

        this._object_payload = response.data.data
        return this._object_payload[key] || fallback
    }

    get api() {
        return this.client.api
    }

    get sendbird_api() {
        return this.client.sendbird_api
    }

    get fresh() {
        this._update = true
        return this
    }

    get headers() {
        return this.client.headers
    }
}

module.exports = FreshObject
