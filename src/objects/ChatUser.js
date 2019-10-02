const User = require('./User')
let axios = require('axios')

/**
 * iFunny chat user object, representing a user in a chat
 * @extends {User}
 * @param {String|Number} id                id of this object
 * @param {String|Chat}                     chat that this user is in
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object that can be used before fetching new info
 * @param {Object} opts.chat_data={}        chat data of this object that can be used before fetching new info
 */
class ChatUser extends User {
    constructor(id, chat, opts = {}) {
        super(id, opts)
        this._chat = chat
        this._chat_object_payload = opts.chat_data || {}
    }

    /**
     * Get some value from this objects state in this chat
     * New data is fetched by filtering this user from users in this objects chat
     * @param  {String}  key        Key to query
     * @param  {*}  fallback=null   Fallback value, if no value is found for key
     * @return {Promise<*>}         Retrieved data
     */
    async chat_get(key, fallback = null) {
        let found = this._chat_object_payload[key]

        if (found != undefined && !this._update) {
            return found
        }

        let params = {
            limit: 1,
            user_ids: this.id
        }

        let response = await axios({
            method: 'get',
            url: `${this.sendbird_api}/group_channels/${this._chat.channel_url}/members`,
            params: params,
            headers: await this.sendbird_headers
        })

        this._chat_object_payload = response.data.members[0] || {}
        return this._chat_object_payload[key] || fallback
    }

    /**
     * State of the presence of this user in this chat
     * Pending users have been invited
     * Join users have joined or accepted an invite
     * @type {String}
     */
    get state() {
        return this.chat_get('state')
    }

    /**
     * Timestamp of when this user was last seen online
     * @type {Number}
     */
    get last_online() {
        return this.chat_get('last_seen_at')
    }

    /**
     * Is this user online in this chat?
     * @type {Boolean}
     */
    get is_online() {
        return this.chat_get('is_online')
    }

    /**
     * The chat that this user is in
     * @type {Chat}
     */
    get chat() {
        return (async () => {
            return this._chat
        })()
    }
}

module.exports = ChatUser
