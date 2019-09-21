const axios = require('axios')
const FreshObject = require('./FreshObject')

class Comment extends FreshObject {
    constructor(id, post, opts = {}) {
        super(id, opts)
        if (typeof(post) === 'object') {
            post = post.id
        }

        this.url = `${this.api}/content/${this.post}/comments/${this.id}`
    }
}
