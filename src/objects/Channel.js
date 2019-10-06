const FreshObject = require('./FreshObject')
const methods = require('../utils/methods')

/**
 * iFunny channel object, representing a channel topic in explore
 * @extends FreshObject
 */
class Channel extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts)
    }

    async get(key, fallback = null) {
        this._update = false
        return this._object_payload[key] || fallback
    }

    /**
     * Generator iterating posts in this Channel
     * @type {Promise<Generator<Post>>}
     */
    get feed() {
        return methods.paginated_generator(this.client.channel_feed_paginated, { instance: this.client, channel: this.id })
    }
}
