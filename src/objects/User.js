const FreshObject = require('./FreshObject')
const Image = require('./small/Image')
const axios = require('axios')

class User extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts)
        this.url = `${this.api}/users/${id}`
    }

    get nick() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('nick')
        })()
    }

    get original_nick() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('original_nick')
        })()
    }

    get about() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('about')
        })()
    }

    get subscriber_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[subscriptions] || this.fresh.get('num')[subscriptions]
        })()
    }

    get subscription_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[subscribers] || this.fresh.get('num')[subscribers]
        })()
    }

    get post_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[total_posts] || this.fresh.get('num')[total_posts]
        })()
    }

    get original_post_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[created] || this.fresh.get('num')[created]
        })()
    }

    get republication_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.post_count - await this.original_post_count
        })()
    }

    get feature_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[featured] || this.fresh.get('num')[featured]
        })()
    }

    get smile_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[total_smiles] || this.fresh.get('num')[total_smiles]
        })()
    }

    get achievement_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num')[achievements] || this.fresh.get('num')[achievements]
        })()
    }

    get messaging_privacy() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('messaging_privacy_status')
        })()
    }

    get link() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('web_url')
        })()
    }

    get can_chat() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_available_for_chat')
        })()
    }

    get is_private() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_private')
        })()
    }

    get is_blocked() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_blocked')
        })()
    }

    get is_blocking_me() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('are_you_blocked')
        })()
    }

    get is_banned() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_banned')
        })()
    }

    get is_deleted() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_deleted')
        })()
    }

    get is_verified() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_verified')
        })()
    }

    get is_in_subscriptions() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_in_subscriptions')
        })()
    }

    get is_subscribed() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_in_subscribers')
        })()
    }

    get is_subscribed_to_updates() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_subscribed_to_updates')
        })()
    }

    get cover_url() {
        /*
        type: Image
        */
        return (async () => {
            return new Image(this.get('cover_url'), {
                client: this.client,
                background: this.get('cover_bg_color')
            })
        })()
    }

    get rating() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('rating')
            return new Rating({
                client: this.client,
                data: self.get("rating")
            })
        })()
    } // objectify

    get bans() {
        /*
        type: list
        */
        return (async () => {
            return await this.get('bans')
        })()
    } // from paginated

    get days() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('meme_experience').days
        })()
    }

    get rank() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('meme_experience').rank
        })()
    }
}

module.exports = User
