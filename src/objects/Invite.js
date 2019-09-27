/**
 * iFunny chat invite class, used when invite events are emitted
 * @param {Object} data invite data from the websocket
 * @param {Object} params optional parameters
 * @param {Object} params.client client that recieved this invite
 */
class Invite {
    constructor(data, opts = {}) {
        let Client = require('./Client')
        this.client = opts.client || new Client()
        this.types = {
            10000: 'accepted',
            10020: 'pending',
            10022: 'rejected'
        }

        this._object_payload = data
        this._channel_url = null
        this._chat = null
        this._inviter = null
        this._invited = null
    }

    async get(key, fallback = null) {
        return this._object_payload[key] || fallback
    }

    get inviter() {
        return (async () => {
            if (this._inviter) {
                return this._inviter
            }

            let ChatUser = require('./ChatUser')
            let inviter = (await this.get('data')).inviter
            this._inviter = new ChatUser(inviter.user_id, (await this.chat), { client: this.client })
            return this._inviter
        })()
    }

    get invited() {
        return (async () => {
            if (this._invited) {
                return this._invited
            }

            let ChatUser = require('./ChatUser')
            let invited = (await this.get('data')).invitees
            let chat = await this.chat
            this._invited = invited.map(it => new ChatUser(it.user_id, chat, { client: this.client }))
            return this._invited
        })()
    }

    get url() {
        return (async () => {
            return `${await this.client.sendbird_api}/group_channels/${await this.channel_url}`
        })()
    }

    get type() {
        return (async () => {
            let cat = await this.get('cat')
            return this.types[cat] || `unknown (${cat})`
        })()
    }

    get sendbird_headers() {
        return this.client.sendbird_headers
    }
}

module.exports = Invite
