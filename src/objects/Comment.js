const axios = require('axios')
const FreshObject = require('./FreshObject')

/**
 * iFunny Comment object, representing a comment or reply
 * @extends {FreshObject}
 * @param {String|Number} id                id of this object
 * @param {String|Post} post                the Post that this comment is on
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class Comment extends FreshObject {

    constructor(id, post, opts = {}) {
        super(id, opts)
        this.url = `${this.api}/content/${post}/comments/${this.id}`
        this._object_payload = opts.data || {}
        this._post_id = post.id || post
    }

    async get(key, fallback = null) {
        let found = this._object_payload[key]
        if (found != undefined && !this._update) {
            this._update = false
            return found
        }

        this._update = false
        let response = await axios({
            method: 'get',
            url: this.url,
            headers: await this.headers
        })

        this._object_payload = response.data.data.comment
        return this._object_payload[key] || fallback
    }

    /**
     * The Post that this comment is on
     * @type {Promise<Post>}
     */
    get post() {
        return (async () => {
            let data = await this.get('post')
            let Post = require('./Post')
            return new Post(await this.get('cid'), { client: this.client, data: data })
        })()
    }

    /**
     * The User who authored this comment
     * @type {Promise<User>}
     */
    get author() {
        return (async () => {
            let data = await this.get('user')
            let User = require('./User')
            return new User(data.id, { client: this.client, data: data })
        })()
    }

    /**
     * The most recent reply to this Comment
     * @type {Promise<Comment>}
     */
    get last_reply() {
        return (async () => {
            let data = await this.get('last_reply')
            return new Comment(data.id, data.cid, { client: this.client, data: data })
        })()
    }

    /**
     * The post in this comment, if any
     * @type {Promise<Post|None>}
     */
    get attached_post() {
        return (async () => {
            let data = await this.get(attachments)
                .content

            if (!data) {
                return null
            }

            data = data[0]
            let Post = require('./Post')
            return new Post(data.id, { client: this.client, data: data }) || null
        })()
    }

    /**
     * The state of this comment.
     * Top comments are top.
     * Deleted comments are deleted
     * Other comments are normal
     * @type {Promise<String>}
     */
    get state() {
        return this.get('state')
    }

    /**
     * Comment creation timestamp
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get('date')
    }

    /**
     * Text content of this comment
     * @type {Promise<String|null>}
     */
    get text() {
        return this.get('text')
    }

    /**
     * Is this comment a reply?
     * @type {Promise<Boolean>}
     */
    get is_reply() {
        return this.get('is_reply')
    }

    /**
     * Was this comment smiled by the bound Client?
     * @type {Promise<Boolean>}
     */
    get is_smiled() {
        return this.get('is_smiled')
    }

    /**
     * Was this comment unsmiled by the bound Client?
     * @type {Promise<Boolean>}
     */
    get is_unsmiled() {
        return this.get('is_unsmiled')
    }

    /**
     * Has this comment been edited?
     * @type {Promise<Boolean>}
     */
    get is_edited() {
        return this.get('is_edited')
    }

    /**
     * Number of smiles that this comment has
     * @type {Promise<Number>}
     */
    get smile_count() {
        return (async () => {
            return await this.get('num')
                .smiles
        })()
    }

    /**
     * Number of unsmiles that this comment has
     * @type {Promise<Number>}
     */
    get unsmile_count() {
        return (async () => {
            return await this.get('num')
                .unsmiles
        })()
    }

    /**
     * Number of replies to this comment
     * @type {Promise<Number>}
     */
    get reply_count() {
        return (async () => {
            return await this.get('num')
                .replies
        })()
    }

    // type: dict
    get attachments() {
        return this.get('attachments')
    }

}

module.exports = Comment
