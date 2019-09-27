const FreshObject = require('./FreshObject')
const axios = require('axios')

/**
 * An iFunny message sent by a user in a chat
 * @extends {FreshObject}
 */
class Message extends FreshObject {
    constructor(id, channel, opts = {}) {
        super(id, opts)

        if (typeof(channel) == 'object') {
            channel = channel.url
        }

        this.url = `${this.sendbird_api}/group_channels/${channel}/messages/${id}`
    }

    /**
     * Get some value from this objects own internal JSON state
     * @param  {String}  key      key to query
     * @param  {*}  fallback=null fallback value, if no value is found for key
     * @return {Promise<*>}       retrieved data
     */
    async get(key, fallback = null) {
        let found = this._object_payload[key]

        if (found == undefined && !this.update) {
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
     * Send a chat message to the chat that this message came from
     * @param  {String}  content text content of this message
     */
    async send_text_message(content) {
        return await (await this.chat).send_text_message(content)
    }

    /**
     * Content of this message
     * @type {String}
     */
    get content() {
        return this.get('message')
    }

    /**
     * The author of this message
     * @type {ChatUser}
     */
    get author() {
        return (async () => {
            let ChatUser = require('./ChatUser')
            let data = await this.get('user')
            return new ChatUser((await data.user_id), (await this.chat), { client: this.client, data: data })
        })()
    }

    /**
     * The chat that this message was sent in
     * @type {Chat}
     */
    get chat() {
        return (async () => {
            let Chat = require('./Chat')
            return new Chat((await this.get('channel_url')), { client: this.client })
        })()
    }

    /**
     * Timestamp of message recieved in seconds
     * @type {Number}
     */
    get recieved_at() {
        return (async () => {
            return Math.trunc((await this.get('ts')) / 1000)
        })()
    }

    /**
     * Alias to `Message.send_text_message`
     * @type {Method}
     */
    get reply() {
        return this.send_text_message
    }

    get msg_id() {
        return this.get('msg_id')
    }

    get channel_type() {
        return this.get('channel_type')
    }

    get channel_id() {
        return this.get('channel_id')
    }

    get is_guest_msg() {
        return this.get('is_guest_msg')
    }

    get is_removed() {
        return this.get('is_removed')
    }

    get sts() {
        return this.get('sts')
    }

    get custom_type() {
        return this.get('custom_type')
    }

    get mention_type() {
        return this.get('mention_type')
    }

    get mentioned_users() {
        return this.get('mentioned_users')
    }

    get is_op_msg() {
        return this.get('is_op_msg')
    }

    get is_super() {
        return this.get('is_super')
    }

}

module.exports = Message
