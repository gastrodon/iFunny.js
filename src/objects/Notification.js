const axios = require('axios')

/**
 * iFunny Notification object
 * @param {Object} data         data of this notification
 * @param {Object} opts         optional parameters
 * @param {Client} opts.client  client that this notification belongs to
 */
class Notification {
    constructor(data, opts = {}) {
        let Client = require('./Client')
        this.client = opts.client || new Client()
        this._data = data
    }

    async get(key, fallback = null) {
        return this._data[key] || fallback
    }

    /**
     * The type of Notification
     * @type {Promise<String>}
     */
    get type() {
        return this.get('type')
    }

    /**
     * Title of this Notification, if achievement get
     * @type {Promise<String|null>}
     */
    get title() {
        return this.get('title')
    }

    /**
     * Description of this Notification, if achievement get
     * @type {Promise<String|null>}
     */
    get description() {
        return this.get('text')
    }

    /**
     * The User of this Notification, usually the one who caused it, if any
     * @type {Promise<User|null>}
     */
    get user() {
        return (async () => {
            let data = await this.get('user')

            if (!data) {
                return null
            }

            let User = require('./User')
            return User(data.id, { client: this.client, data: data })

        })()
    }

    /**
     * The Comment attached to this Notification, if any
     * @type {Promise<Comment|null>}
     */
    get comment() {
        return (async () => {
            let data = await this.get('reply') || await this.get('comment')

            if (!data) {
                return null
            }

            let Comment = require('./Comment')
            return Comment(data.id, this.post, { client: this.client, data: data })
        })()
    }

    /**
     * The Post that is attached to this Notification, if any
     * @type {Promise<Post|null>}
     */
    get post() {
        return (async () => {
            let data = await this.get('content')

            if (!data) {
                return null
            }

            let Post = require('./Post')
            return Post(data.id, { client: this.client, data: data })

        })()
    }

    /**
     * Timestamp of Notification recieved
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get(date)
    }

    /**
     * Smile count, if smile tracker Notification
     * @type {Promise<Number|null>}
     */
    get smile_count() {
        return this.get(smiles, null)
    }
}

module.exports = Notification
