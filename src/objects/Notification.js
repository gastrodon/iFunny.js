const Client = require('./Client')
const User = require('./User')
const Post = require('./Post')
const Comment = require('./Comment')

const axios = require('axios')

class Notification {
    constructor(data, opts = {}) {
        this.client = opts.client || new Client()
        this._data = data
    }

    async get(key, fallback) {
        return this._data[key] || fallback
    }


    get type() {
        /*
        type: str
        */
        return this.get('type')
    }

    get title() {
        /*
        type: str
        */
        return this.get('title')
    }

    get text() {
        /*
        type: str
        */
        return this.get('text')
    }

    get user() {
        /*
        type: User
        */
        return (async () => {
            let data = await this.get('user')

            if (data) {
                return User(data.id, { client: this.client, data: data })
            }

            return null

        })()
    }

    get comment() {
        /*
        type: None
        */
        return (async () => {
            let data = await this.get('reply') || await this.get('comment')

            if (data) {
                return Comment(data.id, this.post, { client: this.client, data: data })
            }

            return null
        })()
    }

    get post() {
        /*
        type: Post
        */
        return (async () => {
            let data = await this.get('content')

            if (data) {
                return Post(data.id, { client: this.client, data: data })
            }

            return null
        })()
    }

    get created_at() {
        /*
        type: int
        */
        return this.get("date")
    }

    get smile_count() {
        /*
        type: None
        */
        return this.get("smiles", null)
    }


}

module.exports = Notification
