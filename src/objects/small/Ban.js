const FreshObject = require('../FreshObject')
const client = require('../Client')

/**
 * iFunny Ban, representing an instance of an active ban
 * @extends {FreshObject}
 * @param {String} id the id of this bans
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {User} opts.user=this.client.user the User who recieved this ban
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class Ban extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts)
        this.user = opts.user || this.client.user

        this.url = `${self.api}/users/${this.user.id}/bans/${self.id}`
    }

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
            headers: await this.headers
        })

        this._object_payload = response.data.data.ban
        return this._object_payload[key] || fallback
    }
}

module.exports = Ban
