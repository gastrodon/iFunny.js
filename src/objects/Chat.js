const FreshObject = require('./FreshObject')
const axios = require('axios')
const methods = require('../utils/methods')

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

    // generators

    /**
     * Generator of the messages in this chat
     * @type {Promise<Generator<Message>>}
     */
    get messages() {
        return methods.paginated_generator(this.client.chat_messages_paginated, { chat: this, instance: this.client })
    }

    /**
     * Generator of the users in this chat
     * @type {Promise<Generator<ChatUser>>}
     */
    get members() {
        return methods.paginated_generator(this.client.chat_members_paginated, { chat: this, instance: this.client })
    }

    // methods

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
     * Send a text message to this chat
     * @param  {String}  content Message content
     * @return {Promise<Chat>}   This chat instance
     */
    async send_text_message(content) {
        await this.client.send_text_message(content, this)
        return this
    }

    /**
     * Send an image message to this chat
     * @param {String}  url             Url pointing to this image
     * @param {Object}  [opts={}]       Optional parameters
     * @param {Number} opts.height=780  Height of this image
     * @param {Number} opts.width=780   Width of this image
     * @param {String} opts.file_name   File name to send this file as
     * @param {String} opts.file_type   MIME type of this file
     * @return {Promise<Chat>}          This chat instance
     */
    async send_image_message(url, opts = {}) {
        await this.client.send_image_message(url, this, opts)
        return this
    }

    /**
     * Mark this chat as read
     * @return {Promise<Chat>} This chat instance
     */
    async read() {
        await this.client.mark_chat_read(this)
        return this.fresh
    }

    /**
     * Add an operator to this chat
     * @param  {User}  user                 User who should be made an operator
     * @return {Promise<Array<ChatUser>>}   Operators of this chat, including the newly added
     */
    async add_operator(user) {
        await this.client.modify_chat_operator('put', user, this)
        return await this.fresh.operators
    }

    /**
     * Remove an operator from this chat
     * @param  {User}  user                 User who should no longer be an operator
     * @return {Promise<Array<ChatUser>>}   Remaining operators of this chat
     */
    async remove_operator(user) {
        await this.client.modify_chat_operator('delete', user, this)
        return await this.fresh.operators
    }

    /**
     * Add an admin to this chat
     * @param  {User|String}            user User that should be an admin
     * @return {Promise<Array<ChatUser>>}     Admins of this chat, including the newly added
     */
    async add_admin(user) {
        await this.client.add_chat_admin(user, this)
        return await this.fresh.admins
    }

    /**
     * Remove an admin from this chat
     * @param  {User|String}            user User that should not be an admin
     * @return {Promise<Array<ChatUser>>}     Remaining admins of this chat
     */
    async remove_admin(user) {
        await this.client.remove_chat_admin(user, this)
        return await this.fresh.admins
    }

    /**
     * Join this chat
     * @return {Promise<Chat>} This chat instance
     */
    async join() {
        await this.client.modify_chat_presence('put', this)
        return this.fresh
    }

    /**
     * Leave this chat
     * @return {Promise<Chat>} This chat instance
     */
    async exit() {
        await this.client.modify_chat_presence('delete', this)
        return this.fresh
    }

    /**
     * Kick a user from this chat
     * @param  {User}  user         User that should be kicked from this chat
     * @return {Promise<ChatUser>}  User that was kicked from this chat
     */
    async kick(user) {
        await this.client.kick_chat_user(user, this)
        return user.fresh
    }

    /**
     * Invite a single or multiple users to this chat
     * @param  {User|Array<User>}  user     Users to invite to this chat
     * @return {Promise<Array<ChatUser>>}   Array of users invited
     */
    async invite(user) {
        let ChatUser = require('./ChatUser')
        await this.client.invite_users_to_chat(user, this)
        if (await user.id) {
            return [new ChatUser(user.id, this, { client: this.client, data: user._object_payload })];
        } else {
            return user.map(
                it => new ChatUser(it.id, this, { client: this.client, data: user._object_payload })
            )
        }
    }

    /**
     * Set a chat to be frozen or unfrozen
     * @param  {Boolean}        state Should this chat be frozen?
     * @return {Promise<Chat>}        This chat instance
     */
    async set_frozen(state) {
        await this.client.modify_chat_freeze(state, this)
        return this.fresh
    }

    /**
     * Ensure that this chat is frozen
     * @return {Promise<Chat>} This chat instance
     */
    async freeze() {
        await this.client.modify_chat_freeze(true, this)
        return this.fresh
    }

    /**
     * Ensure that this chat is not frozen
     * @return {Promise<Chat>} This chat instance
     */
    async unfreeze() {
        await this.client.modify_chat_freeze(false, this)
        return this.fresh
    }

    /**
     * Toggle the frozen state of this chat
     * @return {Promise<Chat>} This chat instance
     */
    async toggle_freeze() {
        await this.client.modify_chat_freeze(!(await this.fresh.is_frozen), this)
        return this.fresh
    }

    // getters

    /**
     * Most recent message from this chat
     * @type {Promise<Message>}
     */
    get last_message() {
        return (async () => {
            let Message = require('./Message')
            let data = await this.get('last_message')
            if (data) {
                return new Message(data.message_id, this, { client: this.client })
            }
            return null
        })()
    }

    /**
     * Timestamp of when chats client was invited in seconds
     * @type {Promise<Number>}
     */
    get invited_at() {
        return this.get('invited_at')
    }

    /**
     * This groups type
     * Public groups are `opengroup`
     * Private groups are `group`
     * Direct messages are `chat`
     * @type {Promise<String>}
     */
    get type() {
        return this.get('custom_type')
    }

    /**
     * Is this a public group?
     * @type {Promise<Boolean>}
     */
    get is_public() {
        return (async () => {
            return (await this.type == 'opengroup')
        })()
    }

    /**
     * Is this group private?
     * @type {Promise<Boolean>}
     */
    get is_private() {
        return (async () => {
            return (await this.type == 'group')
        })()
    }

    /**
     * Is this a direct message?
     * @type {Promise<Boolean>}
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
     * @type {Promise<String>}
     */
    get state() {
        return this.get('member_state')
    }

    /**
     * Is this group frozen?
     * @type {Promise<Boolean>}
     */
    get is_frozen() {
        return (async () => {
            return (await this.meta)
                .frozen
        })()
    }

    /**
     * Is this group hidden?
     * @type {Promise<Boolean>}
     */
    get is_hidden() {
        return this.get('is_hidden')
    }

    /**
     * Are push notifications enabled for this client?
     * @type {Promise<Boolean>}
     */
    get is_push_enabled() {
        return this.get('is_push_enabled')
    }

    /**
     * Number of members who have been invited
     * but have not necessarily joined
     * @type {Promise<Number>}
     */
    get member_count() {
        return this.get('member_count')
    }

    /**
     * Number of members who have joined
     * @type {Promise<Number>}
     */
    get joined_member_count() {
        return this.get('joined_member_count')
    }

    /**
     * Is this group discoverable?
     * @type {Promise<Boolean>}
     */
    get is_discoverable() {
        return this.get('is_discoverable')
    }

    /**
     * Unread message count
     * @type {Promise<Number>}
     */
    get unread_count() {
        return this.get('unread_message_count')
    }

    /**
     * This groups cover images
     * @type {Promise<Image>}
     */
    get cover() {
        return (async () => {
            let Image = require('./small/Image')
            return new Image(await this.get('cover_url'), { client: this.client })
        })()
    }

    /**
     * This groups metadata
     * @type {Promise<Object>}
     */
    get meta() {
        return (async () => {
            return JSON.parse(await this.get('data'))
                .chatInfo || {}
        })()
    }

    /**
     * The operators of this group
     * @type {Promise<Array<ChatUser>>}
     */
    get operators() {
        return (async () => {
            let ChatUser = require('./ChatUser')
            return ((await this.meta)
                    .operatorsIdList || [])
                .map(
                    id => new ChatUser(id, this, { client: this.client })
                )
        })()
    }

    /**
     * The admins of this group
     * @type {Promise<Array<ChatUser>>}
     */
    get admins() {
        return (async () => {
            let ChatUser = require('./ChatUser')
            return ((await this.meta)
                    .adminsIdList || [])
                .map(
                    id => new ChatUser(id, this, { client: this.client })
                )
        })()
    }

    /**
     * Permalink to this chat
     * @type {Promise<String>}
     */
    get link() {
        return (async () => {
            return (await this.meta)
                .permalink
        })()
    }

    /**
     * Channel name
     * @type {Promise<String>}
     */
    get name() {
        return this.get('name')
    }

    /**
     * Alias to `this.name`
     * @type {Promise<String>}
     */
    get title() {
        return this.name
    }

    /**
     * Timestamp of chat creation in seconds
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get('created_at')
    }

    /**
     * Is this chat muted by the client?
     * @type {Promise<Boolean>}
     */
    get is_muted() {
        return this.get('muted')
    }

    /**
     * A ChatUser of this client in this chat
     * @type {Promise<ChatUser>}
     */
    get me() {
        return (async () => {
            let ChatUser = require('./ChatUser')
            return new ChatUser(this.client.id, this, { client: this.client })
        })()
    }

    /**
     * Total number of messages in this chat
     * @type {Promise<Number>}
     */
    get message_count() {
        return this.client.chat_message_total(this)
    }

}

module.exports = Chat
