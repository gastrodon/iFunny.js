const FreshObject = require('./FreshObject')
const axios = require('axios')

/**
 * iFunny chat class, representing a private, public, or direct messaging chat
 * @extends {FreshObject}
 * @param {String|Number} channel_url       sendbird channel_url of this channel
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class Chat extends FreshObject {
    constructor(channel_url, opts = {}) {
        super(channel_url, opts)
        this.channel_url = this.id
        this.url = `${this.sendbird_api}/group_channels/${this.channel_url}`
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
            this._update = false
            return found
        }

        this._update = false
        let response = await axios({
            method: 'get',
            url: this.url,
            headers: await this.sendbird_headers
        })

        this._object_payload = response.data
        return this._object_payload[key] || fallback
    }

    /**
     * Send a text message to this channel
     * @param  {String}  content content of this message
     * @return {Promise<Chat>}   chat that the message was sent to
     */
    async send_text_message(content) {
        return await this.client.send_text_message(content, await this.channel_url)
    }

    /**
     * Timestamp of when chats client was invited in seconds
     * @type {Number}
     */
    get invited_at() {
        return this.get('invited_at')
    }

    /**
     * This groups type
     * Public groups are `opengroup`
     * Private groups are `group`
     * Direct messages are `chat`
     * @type {String}
     */
    get type() {
        return this.get('custom_type')
    }

    /**
     * Is this a public group?
     * @type {Boolean}
     */
    get is_public() {
        return (async () => {
            return (await this.type == 'opengroup')
        })()
    }

    /**
     * Is this group private?
     * @type {Boolean}
     */
    get is_private() {
        return (async () => {
            return (await this.type == 'group')
        })()
    }

    /**
     * Is this a direct message?
     * @type {Boolean}
     */
    get is_direct() {
        return (async () => {
            return (await this.type == 'chat')
        })()
    }

    /**
     * This clients state in this group
     * Users who have joined are joined
     * Users who have a pending invite are invited
     * @type {String}
     */
    get state() {
        return this.get('member_state')
    }

    /**
     * Is this group frozen?
     * @type {Boolean}
     */
    get is_frozen() {
        return (async () => {
            return (await this.meta).frozen
        })()
    }

    /**
     * Is this group hidden?
     * @type {Boolean}
     */
    get is_hidden() {
        return this.get('is_hidden')
    }

    /**
     * Are push notifications enabled for this client?
     * @type {Boolean}
     */
    get is_push_enabled() {
        return this.get('is_push_enabled')
    }

    /**
     * Number of members who have been invited
     * but have not necessarily joined
     * @type {Number}
     */
    get member_count() {
        return this.get('member_count')
    }

    /**
     * Number of members who have joined
     * @type {Number}
     */
    get joined_member_count() {
        return this.get('joined_member_count')
    }

    /**
     * Is this group discoverable?
     * @type {Boolean}
     */
    get is_discoverable() {
        return this.get('is_discoverable')
    }

    /**
     * Unread message count
     * @type {Number}
     */
    get unread_count() {
        return this.get('unread_message_count')
    }

    /**
     * This groups cover images
     * @type {Image}
     */
    get cover() {
        return (async () => {
            let Image = require('./Image')
            return new Image(await this.get('cover_url'), { client: this.client })
        })()
    }

    /**
     * This groups metadata
     * @type {Object}
     */
    get meta() {
        return (async () => {
            return JSON.parse(await this.get('data')).chatInfo
        })()
    }

    /**
     * Permalink to this chat
     * @type {String}
     */
    get link() {
        return (async () => {
            return (await this.meta).permalink
        })()
    }

    /**
     * Channel name
     * @type {String}
     */
    get name() {
        return this.get('name')
    }

    /**
     * Alias to `this.name`
     * @type {String}
     */
    get title() {
        return this.name
    }

    /**
     * Timestamp of chat creation in seconds
     * @type {Number}
     */
    get created_at() {
        return this.get('created_at')
    }

}

module.exports = Chat
