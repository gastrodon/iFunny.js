const FreshObject = require('../FreshObject')
const client = require('../Client')

class Ban extends FreshObject {
    constructor(id, opts = {}) {
        /*
        Ban constructor, for ifunny bans

        params:
        id: id of this object, least amout of information needed to get data
        opts:
            client: Client that this object should be bound to
            data: data payload that can be read from before needing to make a request for fresh data
            user: User that this ban is attached to, if different than the Client user
        */

        super(id, opts)
        this.user = opts.user || this.client.user

        this.url = `${self.api}/users/${this.user.id}/bans/${self.id}`
    }

    async get(key, fallback = null) {
        console.log(this.url)
        let found = this._object_payload[key]

        if (found != undefined && !this._update) {
            return found
        }

        let response = await axios({
            method: 'get',
            url: this.url,
            headers: this.headers
        })

        this._object_payload = response.data.data.ban
        return this._object_payload[key] || fallback
    }
}

module.exports = Ban
