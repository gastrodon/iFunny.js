const EventEmitter = require('events')
const axios = require('axios')
const { homedir } = require('os')

/**
 * Base class for obects have dynamic data, that can be updated
 * Data represented by this object will be retrieved from it's own internal state
 * unless that data does not exist, or the `fresh` getter was used to set the update flag
 * @extends {EventEmitter}
 * @param {String|Number} id                id of this object
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */

class FreshObject extends EventEmitter {
    constructor(id, opts = {}) {
        super()
        if (id === undefined) {
            throw new TypeError('id should be a String or Number')
        }

        let Client = require('./Client')
        this.client = opts.client || new Client()
        this.id = id
        this.paginated_size = this.client.paginated_size
        this.url = undefined

        this._object_payload = opts.data || {}
        this._update = false
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

    /**
     * Shortcut for `this.client.api`
     * @type {String}
     */
    get api() {
        return this.client.api
    }

    /**
     * Shortcut for `this.client.sendbird_api`
     * @type {String}
     */
    get sendbird_api() {
        return this.client.sendbird_api
    }

    /**
     * Set the update flag and return this object for fetching new data
     * @example
     * this.foo         // returns cached value for foo
     * this.fresh.foo   // returns latest value for foo
     * @type {FreshObject}
     */
    get fresh() {
        this._update = true
        return this
    }

    /**
     * Shortcut for `this.client.headers`
     * @type {Object}
     */
    get headers() {
        return this.client.headers
    }
}

module.exports = FreshObject
