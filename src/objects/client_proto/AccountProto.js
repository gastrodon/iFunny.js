const Client = require('../Client')
const axios = require('axios')
const qs = require('qs')
// TODO: data dicts need complete data

/**
 * Update the nick of the client
 * @param  {String} nick Updated nickname
 * @return {Object} API response
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
    }).catch(e => { console.log(e); })

    return response
}

/**
 * Update the about of the client
 * @param  {String} about Updated about content
 * @return {Object} API response
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
 * @return {Object} API response
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

module.exports = Client
