const axios = require('axios')
const FreshObject = require('./FreshObject')
const User = require('./User')

class Post extends FreshObject {
    constructor(id, opts = {}) {
        /*
        Post object, for iFunny images and videos
        */
        super(id, opts)
        this.url = `${this.api}/content/${id}`
    }

    get author() {
        return (async () => {
            let author = await this.get('creator')
            return new User(author.id, {data: author, client: this.client})
        })()
    }

}

module.exports = Post
