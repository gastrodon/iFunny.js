const FreshObject = require('./FreshObject')
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
    }

    // methods

    async subscribe() {
        await this.client.modify_user_subscription_status('put', this)
        return this.fresh
    }

    async unsubscribe() {
        await this.client.modify_user_subscription_status('delete', this)
        return this.fresh
    }

    async subscribe_to_updates() {
        await this.client.modify_user_updates_subscription_status('put', this)
        return this.fresh
    }

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
     * @return {User}                  This user
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
     * @return {User}                  This user
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

    async report(type) {
        await this.client.report_user(this, type)
        return this
    }

    /**
     * This user's nickname (or, username)
     * @type {String}
     */
    get nick() {
        return this.get('nick')
    }

    /**
     * This user's original nickname
     * @type {String}
     */
    get original_nick() {
        return this.get('original_nick')
    }

    /**
     * This user's about section (or, bio)
     * @type {String}
     */
    get about() {
        return this.get('about')
    }

    /**
     * Number of subscribers to this user
     * @type {Number}
     */
    get subscriber_count() {
        return (async () => {
            return await this.get('num')[subscriptions] || this.fresh.get('num')[subscriptions]
        })()
    }

    /**
     * Number of users this user is subscribed to
     * @type {Number}
     */
    get subscription_count() {
        return (async () => {
            return await this.get('num')[subscribers] || this.fresh.get('num')[subscribers]
        })()
    }

    /**
     * Number of posts in this user's timeline
     * @type {Number}
     */
    get post_count() {
        return (async () => {
            return await this.get('num')[total_posts] || this.fresh.get('num')[total_posts]
        })()
    }

    /**
     * Number of posts that are original in this user's timeline
     * @type {Number}
     */
    get original_post_count() {
        return (async () => {
            return await this.get('num')[created] || this.fresh.get('num')[created]
        })()
    }

    /**
     * Number of posts that are republications in this user's timeline
     * @type {Number}
     */
    get republication_count() {
        return (async () => {
            return await this.post_count - await this.original_post_count
        })()
    }

    /**
     * Number of featured posts in this user's timeline
     * @type {Number}
     */
    get feature_count() {
        return (async () => {
            return await this.get('num')[featured] || this.fresh.get('num')[featured]
        })()
    }

    /**
     * Total number of smiles accross all comments and posts by this user
     * @type {Number}
     */
    get smile_count() {
        return (async () => {
            return await this.get('num')[total_smiles] || this.fresh.get('num')[total_smiles]
        })()
    }

    /**
     * Number of achievements obtained by this user
     * @type {Number}
     */
    get achievement_count() {
        return (async () => {
            return await this.get('num')[achievements] || this.fresh.get('num')[achievements]
        })()
    }

    get rating() {
        return this.get('rating')
    }

    /**
     * This user's rating (or, exp score)
     * @type {Number}
     */
    get points() {
        return (async () => {
            return await this.get('rating').points || await this.fresh.get('rating').points
        })()
    }

    /**
     * Is this user's level visible to other users?
     * @type {Boolean}
     */
    get is_level_visible() {
        return (async () => {
            return await this.get('rating').is_show_level || await this.fresh.get('rating').is_show_level
        })()
    }

    /**
     * This user's level
     * @type {Number}
     */
    get level() {
        return this.get('current_level')
    }

    /**
     * This user's active day count
     * @type {Number}
     */
    get days() {
        return (async () => {
            return await this.get('meme_experience').days
        })()
    }

    /**
     * This user's meme experience rank
     * @type {String}
     */
    get rank() {
        return (async () => {
            return await this.get('meme_experience').rank
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
     * @type {String}
     */
    get chat_privacy() {
        return this.get('messaging_privacy_status') === 1
    }

    /**
     * Is this user banned?
     * @type {Boolean}
     */
    get is_banned() {
        return this.get('is_banned')
    }

    /**
     * Is this user deleted?
     * @type {Boolean}
     */
    get is_deleted() {
        return this.get('is_deleted')
    }

    // authentication dependent properties

    /**
     * Can this user chat with it's client?
     * @type {Boolean}
     */
    get can_chat() {
        return this.get('is_available_for_chat')
    }

    /**
     * Has this user enabled private mode?
     * @type {Boolean}
     */
    get is_private() {
        return this.get('is_private')
    }

    /**
     * Has the client blocked this user?
     * @type {Boolean}
     */
    get is_blocked() {
        return this.get('is_blocked')
    }

    /**
     * Has this user blocked the client?
     * @type {Boolean}
     */
    get is_blocking_me() {
        return this.get('are_you_blocked')
    }

    /**
     * Is this user verified?
     * @type {Boolean}
     */
    get is_verified() {
        return this.get('is_verified')
    }

    /**
     * Is this user subscribed to the client?
     * @type {Boolean}
     */
    get is_subscriber() {
        return this.get('is_in_subscriptions')
    }

    /**
     * Is the client subscribed to this user?
     * @type {Boolean}
     */
    get is_subscription() {
        return this.get('is_in_subscribers')
    }

    /**
     * Is the client subscribed to updates?
     * @type {Boolean}
     */
    get is_updates_subscription() {
        return this.get('is_subscribed_to_updates')
    }

}

module.exports = User
