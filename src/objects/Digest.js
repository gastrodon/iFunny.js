const FreshObject = require('./FreshObject')
const axios = require('axios')
const methods = require('../utils/methods')

/**
 * iFunny digest class, representing weekly digests featured in explore
 * @extends {FreshObject}
 * @param {String|Number} id                id of this object
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class Digest extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts = {})
        this.url = `${this.client.api}/digests/${this.id}`
        this.get_comments = false
        this.get_content = false
    }

    /**
     * Get some value from this objects own internal JSON state
     * @param  {String}  key        Key to query
     * @param  {*}  fallback=null   Fallback value, if no value is found for key
     * @return {Promise<*>}         Retrieved data
     */
    async get(key, fallback = null) {
        let found = this._object_payload[key]

        if (found != undefined && !this._update) {
            this._update = false
            return found
        }

        this._update = false

        let params = {
            contents: ~~this.get_content,
            comments: ~~this.get_comments
        }

        let response = await axios({
            method: 'get',
            url: this.url,
            params: params,
            headers: await this.headers
        })

        this._object_payload = response.data.data
        return this._object_payload[key] || fallback
    }

    /**
     * Mark read a number of posts in this digest
     * @param  {count}  count=this.unread_count Number of posts to mark as read
     * @return {Promise<Digest>}                         This digest
     */
    async read(count) {
        count = count || await this.unread_count
        await this.client.read_digest(this.id, count)
        return this.fresh
    }

    /**
     * Generator of n posts in this digest
     * @param  {Number}     count = 0 Number of posts to yield. If none, all items will be iterated.
     * @return {Promise<Generator<Post>>}      Generator of posts in this digest
     */
    async *posts(count = 0) {
        count = count
        let Post = require('./Post')
        for (let data of await this.get('items')) {
            yield new Post(data.id, { client: this.client, data: data })

            if (--count === 0) {
                break
            }
        }
    }

    /**
     * Generator of n comments in this digest
     * @param  {Number}         count = 0 Number of comments to yield. If none, all items will be iterated.
     * @return {Promise<Generator<Comment>>}       Generator of comments in this digest
     */
    async *comments(count) {
        count = count
        let Comment = require('./Comment')
        for (let data of await this.get('subscription_comments')) {
            yield new Comment(data.commentId, data.contentId, { client: this.client, data: data })

            if (--count === 0) {
                break
            }
        }
    }

    /**
     * The title of this digest
     * @type {Promise<String>}
     */
    get title() {
        return this.get('title')
    }

    /**
     * The position of the client in this digest of read posts
     * @type {Promise<Number>}
     */
    get index() {
        return this.get('count')
    }

    /**
     * Total number of smiles in this digest
     * @type {Promise<Number>}
     */
    get smile_count() {
        return this.get('likes')
    }

    /**
     * Total number of comments in this digest
     * @type {Promise<Number>}
     */
    get comment_count() {
        return this.get('comments')
    }

    /**
     * Total number of posts in this digest
     * @type {Promise<Number>}
     */
    get post_count() {
        return this.get('item_count')
    }

    /**
     * The cover image of this digest
     * @type {Promise<Image>}
     */
    get image() {
        return (async () => {
            let Image = require('./small/Image')
            return new Image(await this.get('image_url'), { client: this.client, background: await this.get('bg_color') })
        })()
    }

    /**
     * Timestamp of digest creation in seconds
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get('creAt')
    }

    /**
     * Number of unread items in this digest
     * @type {Promise<Number>}
     */
    get unread_count() {
        return this.get('unreads')
    }

}
