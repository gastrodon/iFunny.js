const FreshObject = require('./FreshObject')
const methods = require('../utils/methods')
const axios = require('axios')

/**
 * iFunny user object, representing a user
 * @extends {FreshObject}
 * @param {String|Number} id                id of this object
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */

class User extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts)
        this.url = `${this.api}/users/${id}`
        this._chat_url = null
    }

    // methods

    /**
     * Get a user by their nickname
     * @param  {String}  nick      Nick of the user to get
     * @param  {Object}  [opts={}] Optional parameter. See User.opts
     * @return {Promise<User>|Null}           The user found for this nick, or null if no such user
     */
    static async by_nick(nick, opts = {}) {
        if (!opts.user) {
            let Client = require('./Client')
            opts.client = new Client()
        }

        try {
            let response = await axios({
                method: 'GET',
                url: `${opts.client.api}/users/by_nick/${nick}`,
                headers: await opts.client.headers
            })

            return new User(response.data.data.id, { client: this.client, data: response.data.data })
        } catch (err) {
            if (err.response && err.response.data.error === 'not_found' || err.response.data.error === 'user_is_unavailable') {
                return null
            }

            throw err
        }
    }

    /**
     * ChatUser representation of this user in some class
     * @param  {Chat}               chat Chat to represent this user in
     * @return {Promise<ChatUser>}       This user in a Chat
     */
    async in_chat(chat, opts = {}) {
        let ChatUser = require('./ChatUser')

        opts.client = opts.client || this.client
        opts.data = opts.data || this._object_payload
        opts.paginated_size = opts.paginated_size || this.paginated_size

        return new ChatUser(this.id, chat, opts)
    }

    /**
     * Subscribe to this user
     * @return {Promise<User>} The user that this client did subscribe to
     */
    async subscribe() {
        await this.client.modify_user_subscription_status('put', this)
        return this.fresh
    }

    /**
     * Unsubscribe to this user
     * @return {Promise<User>} The user that this client did unsubscribe to
     */
    async unsubscribe() {
        await this.client.modify_user_subscription_status('delete', this)
        return this.fresh
    }

    /**
     * Subscribe to updates from this user
     * @return {Promise<User>} The user that this client did subscribe to updates from
     */
    async subscribe_to_updates() {
        await this.client.modify_user_updates_subscription_status('put', this)
        return this.fresh
    }

    /**
     * Unsubscribe to updates from this user
     * @return {Promise<User>} The user that this client did unsubscribe to updates from
     */
    async unsubscribe_to_updates() {
        await this.client.modify_user_updates_subscription_status('delete', this)
        return this.fresh
    }

    /**
     * Block this user
     * @param  {String}         type   Type of block to use
     *
     *`user`            -> block a single user
     *
     *`installation`    -> block all accounts owned by a user
     *
     * @return {Promise<User>}                  This user
     */
    async block(type) {
        try {
            await this.client.modify_block_of_user('put', this, type)
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'already_blocked') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Unblock this user
     * @param  {String}         type   Type of block to use
     *
     *`user`            -> block a single user
     *
     *`installation`    -> block all accounts owned by a user
     *
     * @return {Promise<User>}                  This user
     */
    async unblock() {
        try {
            await this.client.modify_block_of_user('delete', this)
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'not_blocked') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Report this user
     * @param  {String}         type Type of report to send
     *
     * `hate`   -> hate speech
     *
     * `nude`   -> nudity
     *
     * `spam`   -> spam posting
     *
     * `harm`   -> encouragement of harm or violence
     *
     * `target` -> targeted harrassment
     *
     * @return {Promise<Object>} API response
     */
    async report(type) {
        await this.client.report_user(this, type)
        return this
    }

    // generators

    /**
     * Generator iterating the guests of this user and their visit time
     * Non-self user guests are forbidden to non-admin accounts
     * @type {Promise<Generator<Object>>}
     */
    get guests() {
        return methods.paginated_generator(this.client.user_guests_paginated, { instance: this.client, user: this.id })
    }

    /**
     * Generator iterating through the subscribers of this client
     * @type {Promise<Generator<User>>}
     */
    get subscribers() {
        return methods.paginated_generator(this.client.user_subscribers_paginated, { instance: this.client, user: this.id })
    }

    /**
     * Generator iterating through the subscriptions of this client
     * @type {Promise<Generator<User>>}
     */
    get subscriptions() {
        return methods.paginated_generator(this.client.user_subscriptions_paginated, { instance: this.client, user: this.id })
    }

    /**
     * Generator iterating through the active bans of this client
     * Non-self user bans are forbidden to non-admin accounts
     * @type {Promise<Generator<Ban>>}
     */
    get bans() {
        return methods.paginated_generator(this.client.user_bans_paginated, { instance: this.client, user: this.id })
    }

    // getters

    /**
     * This user's nickname (or, username)
     * @type {Promise<String>}
     */
    get nick() {
        return this.get('nick')
    }

    /**
     * This user's original nickname
     * @type {Promise<String>}
     */
    get original_nick() {
        return this.get('original_nick')
    }

    /**
     * This user's about section (or, bio)
     * @type {Promise<String>}
     */
    get about() {
        return this.get('about')
    }

    /**
     * Number of subscribers to this user
     * @type {Promise<Number>}
     */
    get subscriber_count() {
        return (async () => {
            return (await this.get('num'))
                .subscribers || (this.fresh.get('num'))
                .subscribers
        })()
    }

    /**
     * Number of users this user is subscribed to
     * @type {Promise<Number>}
     */
    get subscription_count() {
        return (async () => {
            return (await this.get('num'))
                .subscriptions || (await this.fresh.get('num'))
                .subscriptions
        })()
    }

    /**
     * Number of posts in this user's timeline
     * @type {Promise<Number>}
     */
    get post_count() {
        return (async () => {
            return (await this.get('num'))
                .total_posts || (await this.fresh.get('num'))
                .total_posts
        })()
    }

    /**
     * Number of posts that are original in this user's timeline
     * @type {Promise<Number>}
     */
    get original_post_count() {
        return (async () => {
            return (await this.get('num'))
                .created || (await this.fresh.get('num'))
                .created
        })()
    }

    /**
     * Number of posts that are republications in this user's timeline
     * @type {Promise<Number>}
     */
    get republication_count() {
        return (async () => {
            return await this.post_count - await this.original_post_count
        })()
    }

    /**
     * Number of featured posts in this user's timeline
     * @type {Promise<Number>}
     */
    get feature_count() {
        return (async () => {
            return (await this.get('num'))
                .featured || (await this.fresh.get('num'))
                .featured
        })()
    }

    /**
     * Total number of smiles accross all comments and posts by this user
     * @type {Promise<Number>}
     */
    get smile_count() {
        return (async () => {
            return (await this.get('num'))
                .total_smiles || (await this.fresh.get('num'))
                .total_smiles
        })()
    }

    /**
     * Number of achievements obtained by this user
     * @type {Promise<Number>}
     */
    get achievement_count() {
        return (async () => {
            return (await this.get('num'))
                .achievements || (await this.fresh.get('num'))
                .achievements
        })()
    }

    get rating() {
        return this.get('rating')
    }

    /**
     * This user's rating (or, exp score)
     * @type {Promise<Number>}
     */
    get points() {
        return (async () => {
            return (await this.get('rating'))
                .points || (await this.fresh.get('rating'))
                .points
        })()
    }

    /**
     * Is this user's level visible to other users?
     * @type {Promise<Boolean>}
     */
    get is_level_visible() {
        return (async () => {
            return (await this.get('rating'))
                .is_show_level || (await this.fresh.get('rating'))
                .is_show_level
        })()
    }

    /**
     * This user's level
     * @type {Promise<Number>}
     */
    get level() {
        return this.get('current_level')
    }

    /**
     * This user's active day count
     * @type {Promise<Number>}
     */
    get days() {
        return (async () => {
            return (await this.get('meme_experience'))
                .days
        })()
    }

    /**
     * This user's meme experience rank
     * @type {Promise<String>}
     */
    get rank() {
        return (async () => {
            return (await this.get('meme_experience'))
                .rank
        })()
    }

    /**
     * This user's messaging privacy setting
     *
     * `public` allows new messages from any user
     *
     * `subscribers` allows new messages from users who a subscription of this user
     *
     * `closed` allows no messaging initiation on this user
     * @type {Promise<String>}
     */
    get chat_privacy() {
        return this.get('messaging_privacy_status')
    }

    /**
     * Get the chat channel_url for this user, if they are available for chat
     * @type {String|Null}
     */
    get chat_url() {
        return (async () => {
            if (!await this.can_chat || this.client.id_sync == this.id) {
                return null
            }

            return (await this.client.get_user_chat_url(this))
                .data
                .chatUrl
        })()
    }

    get chat() {
        return (async () => {
            let url = await this.chat_url()

            if (!url) {
                return null
            }

            return new Chat(url, { client: this.client })
        })()
    }

    /**
     * Is this user banned?
     * @type {Promise<Boolean>}
     */
    get is_banned() {
        return this.get('is_banned')
    }

    /**
     * Is this user deleted?
     * @type {Promise<Boolean>}
     */
    get is_deleted() {
        return this.get('is_deleted')
    }

    /**
     * Get the profile image of this user
     * @type {Promise<Image>}
     */
    get profile_image() {
        return (async () => {
            let Image = require('./small/Image')
            let data = await this.get('photo')
            if (data) {
                return new Image(data.url, { client: this, background: data.bg_color, thumbs: data.thumb })
            }
        })()
    }

    /**
     * Get the cover image of this user
     * @type {Promise<Image>}
     */
    get cover_image() {
        return (async () => {
            let Image = require('./small/Image')
            let data = await this.get('cover_url')
            if (data) {
                return new Image(data, { client: this, background: await this.get('cover_bg_color', undefined) })
            }
        })()
    }

    // authentication dependent properties

    /**
     * Can this user chat with it's client?
     * @type {Promise<Boolean>}
     */
    get can_chat() {
        return this.get('is_available_for_chat')
    }

    /**
     * Has this user enabled private mode?
     * @type {Promise<Boolean>}
     */
    get is_private() {
        return this.get('is_private')
    }

    /**
     * Has the client blocked this user?
     * @type {Promise<Boolean>}
     */
    get is_blocked() {
        return this.get('is_blocked')
    }

    /**
     * Has this user blocked the client?
     * @type {Promise<Boolean>}
     */
    get is_blocking_me() {
        return this.get('are_you_blocked')
    }

    /**
     * Is this user verified?
     * @type {Promise<Boolean>}
     */
    get is_verified() {
        return this.get('is_verified')
    }

    /**
     * Is this user subscribed to the client?
     * @type {Promise<Boolean>}
     */
    get is_subscriber() {
        return this.get('is_in_subscriptions')
    }

    /**
     * Is the client subscribed to this user?
     * @type {Promise<Boolean>}
     */
    get is_subscription() {
        return this.get('is_in_subscribers')
    }

    /**
     * Is the client subscribed to updates?
     * @type {Promise<Boolean>}
     */
    get is_updates_subscription() {
        return this.get('is_subscribed_to_updates')
    }

}

module.exports = User
