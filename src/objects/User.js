const FreshObject = require('./FreshObject')
const axios = require('axios')

/**
 * iFunny User object, representing a user
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

    get nick() {
        return this.get('nick')
    }

    get original_nick() {
        return this.get('original_nick')
    }

    get about() {
        return this.get('about')
    }

    get subscriber_count() {
        return (async () => {
            return await this.get('num')[subscriptions] || this.fresh.get('num')[subscriptions]
        })()
    }

    get subscription_count() {
        return (async () => {
            return await this.get('num')[subscribers] || this.fresh.get('num')[subscribers]
        })()
    }

    get post_count() {
        return (async () => {
            return await this.get('num')[total_posts] || this.fresh.get('num')[total_posts]
        })()
    }

    get original_post_count() {
        return (async () => {
            return await this.get('num')[created] || this.fresh.get('num')[created]
        })()
    }

    get republication_count() {
        return (async () => {
            return await this.post_count - await this.original_post_count
        })()
    }

    get feature_count() {
        return (async () => {
            return await this.get('num')[featured] || this.fresh.get('num')[featured]
        })()
    }

    get smile_count() {
        return (async () => {
            return await this.get('num')[total_smiles] || this.fresh.get('num')[total_smiles]
        })()
    }

    get achievement_count() {
        return (async () => {
            return await this.get('num')[achievements] || this.fresh.get('num')[achievements]
        })()
    }

    get rating() {
        return this.get('rating')
    }

    get points() {
        return (async () => {
            return await this.get('rating').points || await this.fresh.get('rating').points
        })()
    }

    get is_level_visible() {
        return (async () => {
            return await this.get('rating').is_show_level || await this.fresh.get('rating').is_show_level
        })()
    }

    get level() {
        return this.get('current_level')
    }

    get bans() {
        return
    } // from paginated

    get days() {
        return (async () => {
            return await this.get('meme_experience').days
        })()
    }

    get rank() {
        return (async () => {
            return await this.get('meme_experience').rank
        })()
    }

    // self user

    get messenger_token() {
        return this.get('messenger_token')
    }

    get messaging_privacy_status() {
        return this.get('messaging_privacy_status')
    }

    get phone() {
        return this.get('phone')
    }

    get is_available_for_chat() {
        return this.get('is_available_for_chat')
    }

    get messenger_active() {
        return this.get('messenger_active')
    }

    get is_blocked_in_messenger() {
        return this.get('is_blocked_in_messenger')
    }

    get is_private() {
        return this.get('is_private')
    }

    get safe_mode() {
        return this.get('safe_mode')
    }

    get is_moderator() {
        return this.get('is_moderator')
    }

    get is_ifunny_team_member() {
        return this.get('is_ifunny_team_member')
    }

    get have_unnotified_bans() {
        return this.get('have_unnotified_bans')
    }

    get have_unnotified_strikes() {
        return this.get('have_unnotified_strikes')
    }

    get have_unnotified_achievements() {
        return this.get('have_unnotified_achievements')
    }

    get have_unnotifieds() {
        return this.get('have_unnotifieds')
    }

    get need_account_setup() {
        return this.get('need_account_setup')
    }

    get is_verified() {
        return this.get('is_verified')
    }

    get is_banned() {
        return this.get('is_banned')
    }

    get is_deleted() {
        return this.get('is_deleted')
    }

    get web_url() {
        return this.get('web_url')
    }

    get email() {
        return this.get('email')
    }

}

module.exports = User
