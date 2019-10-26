const Client = require('../Client')
const FormData = require('form-data')
const methods = require('../../utils/methods')
const request = require('request')
const axios = require('axios')
const util = require('util')
const qs = require('qs')

/**
 * Update the nick of the client
 * @param  {String} nick Updated nickname
 * @return {Promise<Object>} API response
 */
Client.prototype.update_nick = async function(nick) {
    let data = {
        nick: nick.toString()
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/account`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Update the about of the client
 * @param  {String} about Updated about content
 * @return {Promise<Object>} API response
 */
Client.prototype.update_about = async function(about) {
    let data = {
        about: about.toString()
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/users/account`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Update the privacy flag of the client
 * @param  {Boolean} is_private Is this client private?
 * @return {Promise<Object>} API response
 */
Client.prototype.update_is_private = async function(is_private) {
    let data = {
        is_private: is_private == true ? 1 : 0
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/users/account`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Log into an iFunny account and authenticate this
 * @param  {String}  email          description
 * @param  {String}  password       password to the account being logged into, optional for accounts with stored bearer tokens
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Boolean} opts.force     bypass stored tokens?
 * @return {Promise<Client>}    this client
 */
/**
 * Event emitted when this client is logged in
 * @event Client#login
 * @property {Boolean} fresh did this login get a fresh token?
 */
Client.prototype.login = async function(email, password, opts = { force: false }) {
    if (!email) {
        throw 'email is required'
    }

    config = await this.config

    if (config[`bearer ${email}`] && !opts.force) {
        this._token = config[`bearer ${email}`]

        try {
            let response = await axios({
                method: 'get',
                url: `${this.api}/account`,
                headers: await this.headers
            })

            this.authorized = true
            this._object_payload = response.data.data
            this.emit('login', false)
            return this

        } catch (error) {
            this._token = null
        }
    }

    if (!password) {
        throw 'no stored token, password is required'
    }

    let data = {
        'grant_type': 'password',
        'username': email,
        'password': password
    }

    data = Object.keys(data)
        .map(key => `${key}=${data[key]}`)
        .join('&')

    let response = await axios({
        method: 'POST',
        url: `${this.api}/oauth2/token`,
        headers: await this.headers,
        data: data
    })

    this._token = response.data.access_token
    this._config[`bearer ${email}`] = response.data.access_token
    this.config = this._config

    response = await axios({
        method: 'GET',
        url: `${this.api}/account`,
        headers: await this.headers
    })

    this._object_payload = response.data.data

    this.emit('login', true)
    return response
}

/**
 * Post an image to the timeline of this client
 * @param  {Object}         image_data                  The image data to post
 * @param  {Object}         opts={}                     Optional parameters
 * @param  {String}         opts.type='pic'             Type of content to post, either a `pic` or `gif`
 * @param  {String}         otps.visibility='public'    Post visibility. See Post#visibility
 * @param  {Array<String>}  opts.tags=[]                Post tags. See Post#tags
 * @param  {Boolean}        opts.wait=false             Wait for this image to post, and return that post?
 * @param  {Number}         opts.timeout=15             Time in seconds to wait for the posted image. This method will check for the posted image every 500 ms
 * @return {Promise<Post|String>}                                Posted image if `opts.wait`, else the pending post id
 */
Client.prototype.post_image = async function(image_data, opts = {}) {
    let form = {
        type: opts.type || 'pic',
        tags: JSON.stringify(opts.tags || []),
        visibility: opts.visibility || 'public',
        image: image_data
    }


    let response = await util.promisify(request)({
        method: 'post',
        url: `${this.api}/content`,
        formData: form,
        headers: await this.headers

    })

    body = JSON.parse(response.body)

    if (!opts.wait) {
        return body.data.id
    }


    let timeout = opts.timeout * 2 || 15
    while (timeout-- >= 0) {
        let result = (await axios({
                method: 'get',
                url: `${this.api}/tasks/${body.data.id}`,
                headers: await this.headers
            }))
            .data.data.result

        if (result) {
            let Post = require('../Post')
            return new Post(result.cid, { client: this })
        }
        await methods.sleep(500)
    }
}

/**
 * Set the newbie status of a Basic token
 * @param  {Boolean}            value has this token held an accout before?
 * @return {Promise<Object>}          API response
 */
Client.prototype.set_newbie = async function(value) {
    let response = await axios({
        method: 'PUT',
        url: `${this.api}/clients/me`,
        data: `newbie=${value == true}`,
        headers: await this.headers
    })

    return response
}

module.exports = Client
