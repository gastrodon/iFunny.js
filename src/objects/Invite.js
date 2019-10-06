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

    // public methods

    async get(key, fallback = null) {
        return this._object_payload[key] || fallback
    }

    /**
     * Accept this invite
     * @return {Promise<Chat>} The chat that this user did join
     */
    async accept() {
        await this.client.modify_pending_invite('accept', await this.chat)
        return await this.chat
    }

    /**
     * Decline this invite
     * @return {Promise<Chat>} The chat that this user did not join
     */
    async decline() {
        await this.client.modify_pending_invite('decline', await this.chat)
        return await this.chat
    }

    // public getters

    /**
     * The user who did send this invite
     * @type {Promise<ChatUser>}
     */
    get inviter() {
        return (async () => {
            if (this._inviter) {
                return this._inviter
            }

            let ChatUser = require('./ChatUser')
            let inviter = (await this.get('data'))
                .inviter
            this._inviter = new ChatUser(inviter.user_id, (await this.chat), { client: this.client })
            return this._inviter
        })()
    }

    /**
     * The users who were invtied
     * @type {Promise<Array<ChatUser>>}
     */
    get invited() {
        return (async () => {
            if (this._invited) {
                return this._invited
            }

            let ChatUser = require('./ChatUser')
            let invited = (await this.get('data'))
                .invitees
            let chat = await this.chat
            this._invited = invited.map(it => new ChatUser(it.user_id, chat, { client: this.client }))
            return this._invited
        })()
    }

    /**
     * Was this invite inviting the clinet?
     * @type {Promise<Boolean>}
     */
    get is_inviting_me() {
        return (async () => {
            return (await this.get('data'))
                .invitees.contains(this.client.id)
        })
    }

    /**
     * The type of invite
     * @type {Promise<String>}
     */
    get type() {
        return (async () => {
            let cat = await this.get('cat')
            return this.types[cat] || `unknown (${cat})`
        })()
    }

    get chat() {
        return (async () => {
            if (!this._chat) {
                let Chat = require('./Chat')
                this._chat = new Chat(await this.get('channel_url'), { client: this.client })
            }

            return this._chat
        })()
    }
}

module.exports = Invite
