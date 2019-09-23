const axios = require('axios')
const FreshObject = require('./FreshObject')

class Comment extends FreshObject {

    constructor(id, post, opts = {}) {
        super(id, opts)

        if (typeof(post) === 'object') {
            post = post.id
        }

        this.url = `${this.api}/content/${post}/comments/${this.id}`
        this._object_payload = opts.data || {}
        this._post_id = post
    }

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

        this._object_payload = response.data.data.comment
        return this._object_payload[key] || fallback
    }

    get state() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('state')
        })()
    }

    get date() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('date')
        })()
    }

    get text() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('text')
        })()
    }

    get is_reply() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_reply')
        })()
    }

    get num() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('num')
        })()
    }

    get is_smiled() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_smiled')
        })()
    }

    get is_unsmiled() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_unsmiled')
        })()
    }

    get is_edited() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_edited')
        })()
    }

    get user() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('user')
        })()
    }

    get attachments() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('attachments')
        })()
    }

    get last_reply() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('last_reply')
        })()
    }

    get cid() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('cid')
        })()
    }
}

module.exports = Comment
